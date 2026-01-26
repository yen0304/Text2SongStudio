import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import (
    Adapter,
    Dataset,
    DatasetType,
    Experiment,
    ExperimentRun,
    ExperimentStatus,
    RunStatus,
)
from app.services.dataset import DatasetService
from app.services.log_capture import LogCaptureService

settings = get_settings()

# Project root for PYTHONPATH (backend is at project_root/backend)
PROJECT_ROOT = Path(__file__).parents[3]


class TrainingService:
    """Service for managing training runs."""

    @staticmethod
    async def start_training(run_id: UUID):
        """Start a training run in the background.

        This method spawns a subprocess to run the real training script and
        captures its output to the database for streaming to the frontend.
        """
        # Create new database session for background task
        engine = create_async_engine(settings.database_url)
        async_session = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        experiment = None
        run = None
        dataset = None
        dataset_path = None

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

                # Validate dataset exists
                if not experiment.dataset_id:
                    run.status = RunStatus.FAILED
                    run.error = "Dataset required for training. Please link a dataset to this experiment."
                    run.completed_at = datetime.utcnow()
                    await db.commit()
                    return

                # Get dataset
                result = await db.execute(
                    select(Dataset).where(Dataset.id == experiment.dataset_id)
                )
                dataset = result.scalar_one_or_none()

                if not dataset:
                    run.status = RunStatus.FAILED
                    run.error = f"Dataset {experiment.dataset_id} not found"
                    run.completed_at = datetime.utcnow()
                    await db.commit()
                    return

                # Update run status to running
                run.status = RunStatus.RUNNING
                run.started_at = datetime.utcnow()
                await db.commit()

                # Create training log entry
                await LogCaptureService.create_log(run_id, db)

                # Export dataset for training
                try:
                    dataset_service = DatasetService(db)
                    dataset_path = await dataset_service.export_dataset(
                        dataset=dataset,
                        format="huggingface",
                        output_path=f"./exports/{dataset.id}",
                    )
                except Exception as e:
                    run.status = RunStatus.FAILED
                    run.error = f"Dataset export failed: {str(e)}"
                    run.completed_at = datetime.utcnow()
                    await db.commit()
                    return

            # Build training command
            config = run.config or {}
            output_dir = f"./adapters/{experiment.id}/{run.id}"
            adapter_name = f"{experiment.name}-{run.name}"

            cmd = TrainingService._build_training_command(
                dataset_path=dataset_path,
                dataset_type=dataset.type,
                output_dir=output_dir,
                adapter_name=adapter_name,
                config=config,
            )

            # Set environment with PYTHONPATH to find model.training module
            env = os.environ.copy()
            env["PYTHONPATH"] = str(PROJECT_ROOT)

            # Start subprocess with pipe for stdout/stderr
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,  # Merge stderr into stdout
                env=env,
                cwd=str(PROJECT_ROOT),  # Run from project root
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

                        # Register adapter after successful training
                        (
                            adapter_id,
                            final_loss,
                        ) = await TrainingService._register_adapter(
                            db=db,
                            output_dir=output_dir,
                            adapter_name=adapter_name,
                            experiment=experiment,
                            dataset=dataset,
                        )

                        if adapter_id:
                            run.adapter_id = adapter_id
                        if final_loss is not None:
                            run.final_loss = final_loss
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
        dataset_path: str,
        dataset_type: DatasetType,
        output_dir: str,
        adapter_name: str,
        config: dict,
    ) -> list[str]:
        """Build the command to run real training via model.training.cli."""
        # Determine dataset file based on type
        if dataset_type == DatasetType.SUPERVISED:
            dataset_file = os.path.join(dataset_path, "train.jsonl")
            training_type = "supervised"
        else:
            dataset_file = os.path.join(dataset_path, "preferences.jsonl")
            training_type = "preference"

        cmd = [
            "python",
            "-m",
            "model.training.cli",
            "train",
            "--dataset",
            dataset_file,
            "--type",
            training_type,
            "--output",
            output_dir,
            "--name",
            adapter_name,
        ]

        # Map experiment config to CLI arguments
        if config.get("epochs"):
            cmd.extend(["--epochs", str(config["epochs"])])
        if config.get("batch_size"):
            cmd.extend(["--batch-size", str(config["batch_size"])])
        if config.get("learning_rate"):
            cmd.extend(["--lr", str(config["learning_rate"])])
        if config.get("lora_r"):
            cmd.extend(["--lora-r", str(config["lora_r"])])
        if config.get("lora_alpha"):
            cmd.extend(["--lora-alpha", str(config["lora_alpha"])])
        if config.get("base_model"):
            cmd.extend(["--base-model", str(config["base_model"])])
        if config.get("dpo_beta"):
            cmd.extend(["--beta", str(config["dpo_beta"])])

        # Generate version from timestamp
        version = datetime.utcnow().strftime("%Y.%m.%d.%H%M")
        cmd.extend(["--version", version])

        return cmd

    @staticmethod
    async def _register_adapter(
        db: AsyncSession,
        output_dir: str,
        adapter_name: str,
        experiment: Experiment,
        dataset: Dataset,
    ) -> tuple[UUID | None, float | None]:
        """Register the trained adapter in the database.

        Returns (adapter_id, final_loss) tuple.
        """
        final_path = os.path.join(output_dir, "final")
        config_path = os.path.join(output_dir, "training_config.json")

        # Check if training output exists
        if not os.path.exists(final_path):
            return None, None

        # Load training config if available
        training_config = {}
        final_loss = None
        if os.path.exists(config_path):
            try:
                with open(config_path) as f:
                    training_config = json.load(f)
                # Try to get final loss from config or metrics
                final_loss = training_config.get("final_loss")
            except Exception:
                pass

        # Generate version
        version = datetime.utcnow().strftime("%Y.%m.%d.%H%M")

        # Create adapter record
        adapter = Adapter(
            name=adapter_name,
            version=version,
            description=f"Trained from experiment '{experiment.name}'",
            base_model=training_config.get("base_model", "facebook/musicgen-small"),
            storage_path=os.path.abspath(final_path),
            training_dataset_id=dataset.id,
            training_config=training_config,
            is_active=True,
            status="active",
        )

        db.add(adapter)
        await db.commit()
        await db.refresh(adapter)

        return adapter.id, final_loss

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
