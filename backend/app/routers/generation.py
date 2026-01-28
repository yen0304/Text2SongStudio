from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Adapter,
    AudioTag,
    GenerationJob,
    JobStatus,
    PreferencePair,
    Prompt,
    QualityRating,
)
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

    # Verify adapter is active (if provided)
    if data.adapter_id:
        adapter_result = await db.execute(
            select(Adapter).where(Adapter.id == data.adapter_id)
        )
        adapter = adapter_result.scalar_one_or_none()
        if not adapter:
            raise HTTPException(status_code=404, detail="Adapter not found")
        if not adapter.is_active or adapter.status == "archived":
            raise HTTPException(
                status_code=400,
                detail="Cannot use inactive or archived adapter for generation",
            )

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
    """Get all feedback records for a generation job's audio samples.

    Combines data from:
    - QualityRating (ratings with criteria)
    - PreferencePair (preference comparisons)
    - AudioTag (tags/labels)
    """
    # Fetch job
    result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    audio_ids = job.audio_ids or []

    # Query all ratings for the job's audio samples
    ratings_list: list[QualityRating] = []
    preferences_list: list[PreferencePair] = []
    tags_by_audio: dict[UUID, list[str]] = {aid: [] for aid in audio_ids}

    if audio_ids:
        # Get quality ratings
        ratings_result = await db.execute(
            select(QualityRating)
            .where(QualityRating.audio_id.in_(audio_ids))
            .order_by(QualityRating.created_at.desc())
        )
        ratings_list = list(ratings_result.scalars().all())

        # Get preference pairs (where any audio is chosen or rejected)
        prefs_result = await db.execute(
            select(PreferencePair)
            .where(
                (PreferencePair.chosen_audio_id.in_(audio_ids))
                | (PreferencePair.rejected_audio_id.in_(audio_ids))
            )
            .order_by(PreferencePair.created_at.desc())
        )
        preferences_list = list(prefs_result.scalars().all())

        # Get audio tags
        tags_result = await db.execute(
            select(AudioTag).where(AudioTag.audio_id.in_(audio_ids))
        )
        for tag in tags_result.scalars().all():
            if tag.audio_id in tags_by_audio:
                tags_by_audio[tag.audio_id].append(tag.tag)

    # Group ratings by audio_id
    ratings_by_audio: dict[UUID, list[QualityRating]] = {aid: [] for aid in audio_ids}
    for rating in ratings_list:
        if rating.audio_id in ratings_by_audio:
            ratings_by_audio[rating.audio_id].append(rating)

    # Group preferences by chosen audio_id (to show "preferred over" relationships)
    prefs_by_chosen: dict[UUID, list[PreferencePair]] = {aid: [] for aid in audio_ids}
    for pref in preferences_list:
        if pref.chosen_audio_id in prefs_by_chosen:
            prefs_by_chosen[pref.chosen_audio_id].append(pref)

    # Calculate stats
    all_ratings = [r.rating for r in ratings_list]
    average_rating = sum(all_ratings) / len(all_ratings) if all_ratings else None
    total_feedback = (
        len(ratings_list)
        + len(preferences_list)
        + sum(len(tags) for tags in tags_by_audio.values())
    )

    # Build response
    samples = []
    for idx, audio_id in enumerate(audio_ids):
        sample_ratings = ratings_by_audio.get(audio_id, [])
        sample_prefs = prefs_by_chosen.get(audio_id, [])
        sample_tags = tags_by_audio.get(audio_id, [])

        sample_rating_values = [r.rating for r in sample_ratings]
        sample_avg = (
            sum(sample_rating_values) / len(sample_rating_values)
            if sample_rating_values
            else None
        )

        # Build feedback items from ratings
        feedback_items = []
        for r in sample_ratings:
            feedback_items.append(
                SampleFeedbackItem(
                    id=r.id,
                    rating=r.rating,
                    rating_criterion=r.criterion,
                    preferred_over=None,
                    tags=None,
                    notes=r.notes,
                    created_at=r.created_at,
                )
            )

        # Build feedback items from preferences
        for p in sample_prefs:
            feedback_items.append(
                SampleFeedbackItem(
                    id=p.id,
                    rating=None,
                    rating_criterion=None,
                    preferred_over=p.rejected_audio_id,
                    tags=None,
                    notes=p.notes,
                    created_at=p.created_at,
                )
            )

        # Add tags as a single feedback item if present
        if sample_tags:
            # Create a synthetic feedback item for tags (no id, use first tag's id or generate)
            # For simplicity, we'll include tags in the sample metadata rather than as a feedback item
            pass

        samples.append(
            SampleFeedbackGroup(
                audio_id=audio_id,
                label=SAMPLE_LABELS[idx] if idx < len(SAMPLE_LABELS) else str(idx + 1),
                feedback=feedback_items,
                average_rating=sample_avg,
                feedback_count=len(feedback_items),
                tags=sample_tags if sample_tags else None,
            )
        )

    return JobFeedbackResponse(
        job_id=job.id,
        prompt_id=job.prompt_id,
        total_samples=len(audio_ids),
        total_feedback=total_feedback,
        average_rating=average_rating,
        samples=samples,
    )
