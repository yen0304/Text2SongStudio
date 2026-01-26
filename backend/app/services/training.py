import asyncio
import json
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import (
    Experiment,
    ExperimentRun,
    ExperimentStatus,
    RunStatus,
)
from app.services.log_capture import LogCaptureService

settings = get_settings()


class TrainingService:
    """Service for managing training runs."""

    @staticmethod
    async def start_training(run_id: UUID):
        """Start a training run in the background.

        This method spawns a subprocess to run the training script and
        captures its output to the database for streaming to the frontend.
        """
        # Create new database session for background task
        engine = create_async_engine(settings.database_url)
        async_session = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        try:
            async with async_session() as db:
                # Get run and experiment
                result = await db.execute(
                    select(ExperimentRun).where(ExperimentRun.id == run_id)
                )
                run = result.scalar_one_or_none()

                if not run:
                    return

                result = await db.execute(
                    select(Experiment).where(Experiment.id == run.experiment_id)
                )
                experiment = result.scalar_one_or_none()

                if not experiment:
                    return

                # Update run status to running
                run.status = RunStatus.RUNNING
                run.started_at = datetime.utcnow()
                await db.commit()

                # Create training log entry
                await LogCaptureService.create_log(run_id, db)

            # Build training command
            config = run.config or {}
            cmd = TrainingService._build_training_command(
                experiment_id=experiment.id,
                run_id=run_id,
                dataset_id=experiment.dataset_id,
                config=config,
            )

            # Start subprocess with pipe for stdout/stderr
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,  # Merge stderr into stdout
            )

            # Capture output
            exit_code = await LogCaptureService.capture_subprocess_output(
                run_id=run_id,
                process=process,
                db_session_factory=async_session,
            )

            # Update run status based on exit code
            async with async_session() as db:
                result = await db.execute(
                    select(ExperimentRun).where(ExperimentRun.id == run_id)
                )
                run = result.scalar_one_or_none()

                if run:
                    run.completed_at = datetime.utcnow()

                    if exit_code == 0:
                        run.status = RunStatus.COMPLETED
                        # TODO: Parse final metrics from log or config
                    else:
                        run.status = RunStatus.FAILED
                        run.error = f"Training process exited with code {exit_code}"

                    await db.commit()

                    # Update experiment status
                    await TrainingService._update_experiment_status(
                        run.experiment_id, db
                    )

        except Exception as e:
            # Handle errors
            async with async_session() as db:
                result = await db.execute(
                    select(ExperimentRun).where(ExperimentRun.id == run_id)
                )
                run = result.scalar_one_or_none()

                if run:
                    run.status = RunStatus.FAILED
                    run.error = str(e)
                    run.completed_at = datetime.utcnow()
                    await db.commit()

        finally:
            await engine.dispose()

    @staticmethod
    def _build_training_command(
        experiment_id: UUID,
        run_id: UUID,
        dataset_id: UUID | None,
        config: dict,
    ) -> list[str]:
        """Build the command to run training."""
        # This is a placeholder - the actual training script would be customized
        # for the specific ML framework being used
        cmd = [
            "python",
            "-m",
            "app.training.cli",
            "train",
            "--experiment-id",
            str(experiment_id),
            "--run-id",
            str(run_id),
        ]

        if dataset_id:
            cmd.extend(["--dataset-id", str(dataset_id)])

        # Add config as JSON
        if config:
            cmd.extend(["--config", json.dumps(config)])

        return cmd

    @staticmethod
    async def _update_experiment_status(experiment_id: UUID, db: AsyncSession) -> None:
        """Update experiment status based on its runs."""
        result = await db.execute(
            select(Experiment).where(Experiment.id == experiment_id)
        )
        experiment = result.scalar_one_or_none()

        if not experiment:
            return

        # Get all runs
        runs_result = await db.execute(
            select(ExperimentRun).where(ExperimentRun.experiment_id == experiment_id)
        )
        runs = runs_result.scalars().all()

        if not runs:
            experiment.status = ExperimentStatus.DRAFT
        elif any(r.status == RunStatus.RUNNING for r in runs):
            experiment.status = ExperimentStatus.RUNNING
        elif all(r.status in (RunStatus.COMPLETED, RunStatus.CANCELLED) for r in runs):
            experiment.status = ExperimentStatus.COMPLETED

            # Find best run
            completed_runs = [
                r
                for r in runs
                if r.status == RunStatus.COMPLETED and r.final_loss is not None
            ]
            if completed_runs:
                best_run = min(completed_runs, key=lambda r: r.final_loss)
                experiment.best_run_id = best_run.id
                experiment.best_loss = best_run.final_loss
        elif any(r.status == RunStatus.FAILED for r in runs) and not any(
            r.status == RunStatus.RUNNING for r in runs
        ):
            # If any run failed and none are running
            experiment.status = ExperimentStatus.FAILED

        experiment.updated_at = datetime.utcnow()
        await db.commit()
