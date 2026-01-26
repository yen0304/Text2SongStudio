import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TrainingLog


class LogCaptureService:
    """Service for capturing and storing training subprocess output."""

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

        Args:
            run_id: The run ID to associate logs with
            process: The asyncio subprocess
            db_session_factory: Factory function to create database sessions

        Returns:
            The process exit code
        """

        async def read_stream(stream, run_id: UUID, db_session_factory):
            """Read from a stream and append to log."""
            while True:
                chunk = await stream.read(4096)  # Read in 4KB chunks
                if not chunk:
                    break

                async with db_session_factory() as db:
                    await LogCaptureService.append_log(run_id, chunk, db)

        # Read both stdout and stderr concurrently
        tasks = []
        if process.stdout:
            tasks.append(read_stream(process.stdout, run_id, db_session_factory))
        if process.stderr:
            tasks.append(read_stream(process.stderr, run_id, db_session_factory))

        if tasks:
            await asyncio.gather(*tasks)

        # Wait for process to complete
        await process.wait()
        return process.returncode
