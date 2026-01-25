from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Feedback, GenerationJob, JobStatus, Prompt
from app.schemas import GenerationJobResponse, GenerationRequest
from app.schemas.generation import (
    JobFeedbackResponse,
    SampleFeedbackGroup,
    SampleFeedbackItem,
)
from app.services.generation import GenerationService

router = APIRouter(prefix="/generate", tags=["generation"])

SAMPLE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"]


@router.post("", response_model=GenerationJobResponse, status_code=201)
async def submit_generation(
    data: GenerationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Verify prompt exists
    result = await db.execute(select(Prompt).where(Prompt.id == data.prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Create job
    job = GenerationJob(
        prompt_id=data.prompt_id,
        adapter_id=data.adapter_id,
        num_samples=data.num_samples,
        status=JobStatus.QUEUED,
        generation_params={
            "seed": data.seed,
            "temperature": data.temperature,
            "top_k": data.top_k,
            "top_p": data.top_p,
            "duration": data.duration,
        },
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Start generation in background
    background_tasks.add_task(
        GenerationService.process_job,
        job.id,
    )

    return GenerationJobResponse(
        id=job.id,
        status=job.status.value,
        progress=job.progress,
        audio_ids=job.audio_ids,
        error=job.error,
        created_at=job.created_at,
    )


@router.get("/{job_id}", response_model=GenerationJobResponse)
async def get_job_status(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return GenerationJobResponse(
        id=job.id,
        status=job.status.value,
        progress=job.progress,
        audio_ids=job.audio_ids,
        error=job.error,
        created_at=job.created_at,
    )


@router.delete("/{job_id}", status_code=204)
async def cancel_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
        raise HTTPException(
            status_code=400, detail="Cannot cancel completed or failed job"
        )

    job.status = JobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    await db.commit()

    # Signal cancellation to generation service
    GenerationService.cancel_job(job_id)


@router.get("/{job_id}/feedback", response_model=JobFeedbackResponse)
async def get_job_feedback(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all feedback records for a generation job's audio samples."""
    # Fetch job
    result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    audio_ids = job.audio_ids or []

    # Query all feedback for the job's audio samples
    feedback_list: list[Feedback] = []
    if audio_ids:
        feedback_result = await db.execute(
            select(Feedback)
            .where(Feedback.audio_id.in_(audio_ids))
            .order_by(Feedback.created_at.desc())
        )
        feedback_list = list(feedback_result.scalars().all())

    # Group feedback by audio_id
    feedback_by_audio: dict[UUID, list[Feedback]] = {}
    for audio_id in audio_ids:
        feedback_by_audio[audio_id] = []
    for fb in feedback_list:
        if fb.audio_id in feedback_by_audio:
            feedback_by_audio[fb.audio_id].append(fb)

    # Calculate stats
    all_ratings = [fb.rating for fb in feedback_list if fb.rating is not None]
    average_rating = sum(all_ratings) / len(all_ratings) if all_ratings else None

    # Build response
    samples = []
    for idx, audio_id in enumerate(audio_ids):
        sample_feedback = feedback_by_audio.get(audio_id, [])
        sample_ratings = [fb.rating for fb in sample_feedback if fb.rating is not None]
        sample_avg = (
            sum(sample_ratings) / len(sample_ratings) if sample_ratings else None
        )

        samples.append(
            SampleFeedbackGroup(
                audio_id=audio_id,
                label=SAMPLE_LABELS[idx] if idx < len(SAMPLE_LABELS) else str(idx + 1),
                feedback=[
                    SampleFeedbackItem(
                        id=fb.id,
                        rating=fb.rating,
                        rating_criterion=fb.rating_criterion,
                        preferred_over=fb.preferred_over,
                        tags=fb.tags,
                        notes=fb.notes,
                        created_at=fb.created_at,
                    )
                    for fb in sample_feedback
                ],
                average_rating=sample_avg,
                feedback_count=len(sample_feedback),
            )
        )

    return JobFeedbackResponse(
        job_id=job.id,
        prompt_id=job.prompt_id,
        total_samples=len(audio_ids),
        total_feedback=len(feedback_list),
        average_rating=average_rating,
        samples=samples,
    )
