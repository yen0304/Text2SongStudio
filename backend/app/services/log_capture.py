import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ExperimentRun, TrainingLog
from app.services.metric_parser import MetricParser


class LogCaptureService:
    """Service for capturing and storing training subprocess output."""

    # Buffer metrics updates - only write to DB every N chunks
    METRIC_UPDATE_INTERVAL = 5

    @staticmethod
    async def create_log(run_id: UUID, db: AsyncSession) -> TrainingLog:
        """Create a new training log entry for a run."""
        log = TrainingLog(run_id=run_id, data=b"", updated_at=datetime.utcnow())
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def append_log(run_id: UUID, chunk: bytes, db: AsyncSession) -> int:
        """Append data to an existing training log.

        Returns the new total size of the log.
        """
        result = await db.execute(
            select(TrainingLog).where(TrainingLog.run_id == run_id)
        )
        log = result.scalar_one_or_none()

        if log is None:
            # Create if doesn't exist
            log = TrainingLog(run_id=run_id, data=chunk, updated_at=datetime.utcnow())
            db.add(log)
        else:
            # Append to existing data
            log.data = log.data + chunk
            log.updated_at = datetime.utcnow()

        await db.commit()
        return len(log.data)

    @staticmethod
    async def get_log(run_id: UUID, db: AsyncSession) -> TrainingLog | None:
        """Get the training log for a run."""
        result = await db.execute(
            select(TrainingLog).where(TrainingLog.run_id == run_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_log_size(run_id: UUID, db: AsyncSession) -> int:
        """Get the current size of a training log."""
        result = await db.execute(
            select(TrainingLog).where(TrainingLog.run_id == run_id)
        )
        log = result.scalar_one_or_none()
        return len(log.data) if log else 0

    @staticmethod
    async def capture_subprocess_output(
        run_id: UUID,
        process: asyncio.subprocess.Process,
        db_session_factory,
    ) -> int:
        """Capture stdout/stderr from a subprocess and store in database.

        Also parses training metrics from the output and stores them in the
        ExperimentRun.metrics JSON field for visualization.

        Args:
            run_id: The run ID to associate logs with
            process: The asyncio subprocess
            db_session_factory: Factory function to create database sessions

        Returns:
            The process exit code
        """
        # Initialize metric parser for this training run
        metric_parser = MetricParser()
        accumulated_metrics: dict = {}
        chunk_count = 0

        async def read_stream(stream, run_id: UUID, db_session_factory):
            """Read from a stream, append to log, and parse metrics."""
            nonlocal accumulated_metrics, chunk_count

            while True:
                chunk = await stream.read(4096)  # Read in 4KB chunks
                if not chunk:
                    break

                async with db_session_factory() as db:
                    # Append raw log data (existing behavior)
                    await LogCaptureService.append_log(run_id, chunk, db)

                    # Parse metrics from this chunk
                    try:
                        parsed = metric_parser.parse_log_chunk(chunk)
                        if parsed:
                            accumulated_metrics = MetricParser.merge_metrics(
                                accumulated_metrics, parsed
                            )
                            chunk_count += 1

                            # Batch updates to avoid excessive DB writes
                            if chunk_count >= LogCaptureService.METRIC_UPDATE_INTERVAL:
                                await LogCaptureService._update_run_metrics(
                                    run_id, accumulated_metrics, db
                                )
                                chunk_count = 0
                    except Exception:
                        # Don't let metric parsing errors interrupt log capture
                        pass

        # Read both stdout and stderr concurrently
        tasks = []
        if process.stdout:
            tasks.append(read_stream(process.stdout, run_id, db_session_factory))
        if process.stderr:
            tasks.append(read_stream(process.stderr, run_id, db_session_factory))

        if tasks:
            await asyncio.gather(*tasks)

        # Final flush of any remaining metrics
        if accumulated_metrics:
            async with db_session_factory() as db:
                # Downsample if needed before final save
                final_metrics = MetricParser.downsample_metrics(
                    accumulated_metrics, max_points=2000
                )
                await LogCaptureService._update_run_metrics(run_id, final_metrics, db)

        # Wait for process to complete
        await process.wait()
        return process.returncode

    @staticmethod
    async def _update_run_metrics(
        run_id: UUID, metrics: dict, db: AsyncSession
    ) -> None:
        """Update the metrics JSON field on an ExperimentRun.

        Args:
            run_id: The run ID to update
            metrics: The metrics dict to store
            db: Database session
        """
        result = await db.execute(
            select(ExperimentRun).where(ExperimentRun.id == run_id)
        )
        run = result.scalar_one_or_none()

        if run:
            # Merge with existing metrics (in case of restart)
            existing = run.metrics or {}
            for key, values in metrics.items():
                if key not in existing:
                    existing[key] = []
                # Avoid duplicates by checking step numbers
                existing_steps = {p.get("step") for p in existing[key]}
                for point in values:
                    if point.get("step") not in existing_steps:
                        existing[key].append(point)

            run.metrics = existing
            await db.commit()
