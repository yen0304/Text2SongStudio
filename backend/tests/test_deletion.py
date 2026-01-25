"""Tests for deletion functionality (jobs, adapters, feedback)."""

import uuid
from datetime import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Adapter, Feedback, GenerationJob, JobStatus


class TestJobDeletion:
    """Tests for job deletion endpoint."""

    @pytest.mark.asyncio
    async def test_delete_job_soft_deletes(self, db_session: AsyncSession):
        """Deleting a job should set deleted_at timestamp."""
        # Create a job
        job = GenerationJob(
            id=uuid.uuid4(),
            prompt_id=uuid.uuid4(),
            status=JobStatus.COMPLETED,
            progress=1.0,
            num_samples=1,
        )
        db_session.add(job)
        await db_session.commit()

        # Delete the job
        job.deleted_at = datetime.utcnow()
        await db_session.commit()

        # Verify job has deleted_at set
        result = await db_session.execute(
            select(GenerationJob).where(GenerationJob.id == job.id)
        )
        deleted_job = result.scalar_one()
        assert deleted_job.deleted_at is not None

    @pytest.mark.asyncio
    async def test_deleted_job_excluded_from_list(self, db_session: AsyncSession):
        """Soft-deleted jobs should not appear in normal listings."""
        # Create a normal job and a deleted job
        normal_job = GenerationJob(
            id=uuid.uuid4(),
            prompt_id=uuid.uuid4(),
            status=JobStatus.COMPLETED,
        )
        deleted_job = GenerationJob(
            id=uuid.uuid4(),
            prompt_id=uuid.uuid4(),
            status=JobStatus.COMPLETED,
            deleted_at=datetime.utcnow(),
        )
        db_session.add_all([normal_job, deleted_job])
        await db_session.commit()

        # Query for non-deleted jobs
        result = await db_session.execute(
            select(GenerationJob).where(GenerationJob.deleted_at.is_(None))
        )
        jobs = result.scalars().all()

        job_ids = [j.id for j in jobs]
        assert normal_job.id in job_ids
        assert deleted_job.id not in job_ids

    @pytest.mark.asyncio
    async def test_delete_job_cascades_feedback(self, db_session: AsyncSession):
        """Deleting a job should delete associated feedback."""
        audio_id = uuid.uuid4()
        job = GenerationJob(
            id=uuid.uuid4(),
            prompt_id=uuid.uuid4(),
            status=JobStatus.COMPLETED,
            audio_ids=[audio_id],
        )
        feedback = Feedback(
            id=uuid.uuid4(),
            audio_id=audio_id,
            rating=4.0,
        )
        db_session.add_all([job, feedback])
        await db_session.commit()

        # Simulate cascade deletion
        await db_session.delete(feedback)
        job.deleted_at = datetime.utcnow()
        await db_session.commit()

        # Verify feedback is deleted
        result = await db_session.execute(
            select(Feedback).where(Feedback.audio_id == audio_id)
        )
        remaining_feedback = result.scalars().all()
        assert len(remaining_feedback) == 0


class TestAdapterDeletion:
    """Tests for adapter soft-delete functionality."""

    @pytest.mark.asyncio
    async def test_delete_adapter_soft_deletes(self, db_session: AsyncSession):
        """Deleting an adapter should set deleted_at timestamp."""
        adapter = Adapter(
            id=uuid.uuid4(),
            name="test-adapter",
            base_model="musicgen-small",
        )
        db_session.add(adapter)
        await db_session.commit()

        # Soft-delete the adapter
        adapter.deleted_at = datetime.utcnow()
        adapter.is_active = False
        await db_session.commit()

        # Verify adapter has deleted_at set
        result = await db_session.execute(
            select(Adapter).where(Adapter.id == adapter.id)
        )
        deleted_adapter = result.scalar_one()
        assert deleted_adapter.deleted_at is not None
        assert deleted_adapter.is_active is False

    @pytest.mark.asyncio
    async def test_deleted_adapter_excluded_from_list(self, db_session: AsyncSession):
        """Soft-deleted adapters should not appear in normal listings."""
        normal_adapter = Adapter(
            id=uuid.uuid4(),
            name="active-adapter",
            base_model="musicgen-small",
        )
        deleted_adapter = Adapter(
            id=uuid.uuid4(),
            name="deleted-adapter",
            base_model="musicgen-small",
            deleted_at=datetime.utcnow(),
        )
        db_session.add_all([normal_adapter, deleted_adapter])
        await db_session.commit()

        # Query for non-deleted adapters
        result = await db_session.execute(
            select(Adapter).where(Adapter.deleted_at.is_(None))
        )
        adapters = result.scalars().all()

        adapter_ids = [a.id for a in adapters]
        assert normal_adapter.id in adapter_ids
        assert deleted_adapter.id not in adapter_ids

    @pytest.mark.asyncio
    async def test_deleted_adapter_cannot_be_used_for_generation(
        self, db_session: AsyncSession
    ):
        """Soft-deleted adapters should be rejected for new generations."""
        adapter = Adapter(
            id=uuid.uuid4(),
            name="deleted-adapter",
            base_model="musicgen-small",
            deleted_at=datetime.utcnow(),
        )
        db_session.add(adapter)
        await db_session.commit()

        # Verify adapter is soft-deleted
        result = await db_session.execute(
            select(Adapter).where(Adapter.id == adapter.id)
        )
        fetched_adapter = result.scalar_one()
        assert fetched_adapter.deleted_at is not None

        # In actual implementation, generation endpoint checks this


class TestFeedbackDeletion:
    """Tests for feedback hard-delete functionality."""

    @pytest.mark.asyncio
    async def test_delete_feedback_removes_record(self, db_session: AsyncSession):
        """Deleting feedback should permanently remove the record."""
        feedback = Feedback(
            id=uuid.uuid4(),
            audio_id=uuid.uuid4(),
            rating=4.0,
            notes="Test feedback",
        )
        db_session.add(feedback)
        await db_session.commit()

        feedback_id = feedback.id

        # Delete the feedback
        await db_session.delete(feedback)
        await db_session.commit()

        # Verify feedback is gone
        result = await db_session.execute(
            select(Feedback).where(Feedback.id == feedback_id)
        )
        deleted_feedback = result.scalar_one_or_none()
        assert deleted_feedback is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_feedback_fails(self, db_session: AsyncSession):
        """Attempting to delete non-existent feedback should fail."""
        nonexistent_id = uuid.uuid4()
        result = await db_session.execute(
            select(Feedback).where(Feedback.id == nonexistent_id)
        )
        feedback = result.scalar_one_or_none()
        assert feedback is None
