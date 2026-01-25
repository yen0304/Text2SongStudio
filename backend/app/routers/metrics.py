from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Adapter,
    AudioSample,
    Dataset,
    Experiment,
    ExperimentStatus,
    Feedback,
    GenerationJob,
    JobStatus,
)

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/overview")
async def get_overview_metrics(
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard overview metrics for pipeline visualization."""
    # Generation stats
    total_jobs = await db.scalar(select(func.count()).select_from(GenerationJob)) or 0
    completed_jobs = (
        await db.scalar(
            select(func.count()).where(GenerationJob.status == JobStatus.COMPLETED)
        )
        or 0
    )
    active_jobs = (
        await db.scalar(
            select(func.count()).where(
                GenerationJob.status.in_([JobStatus.QUEUED, JobStatus.PROCESSING])
            )
        )
        or 0
    )

    # Audio samples
    total_samples = await db.scalar(select(func.count()).select_from(AudioSample)) or 0

    # Feedback stats
    total_feedback = await db.scalar(select(func.count()).select_from(Feedback)) or 0
    rated_samples = (
        await db.scalar(select(func.count(func.distinct(Feedback.audio_id)))) or 0
    )

    # Calculate average rating
    avg_rating = await db.scalar(
        select(func.avg(Feedback.rating)).where(Feedback.rating.isnot(None))
    )

    # Samples needing feedback (generated but not rated)
    pending_feedback = total_samples - rated_samples

    # Dataset stats
    total_datasets = await db.scalar(select(func.count()).select_from(Dataset)) or 0
    exported_datasets = (
        await db.scalar(select(func.count()).where(Dataset.export_path.isnot(None)))
        or 0
    )

    # Training stats (Experiments)
    total_experiments = (
        await db.scalar(select(func.count()).select_from(Experiment)) or 0
    )
    running_experiments = (
        await db.scalar(
            select(func.count()).where(Experiment.status == ExperimentStatus.RUNNING)
        )
        or 0
    )

    # Adapter stats
    total_adapters = await db.scalar(select(func.count()).select_from(Adapter)) or 0
    active_adapters = (
        await db.scalar(select(func.count()).where(Adapter.is_active.is_(True))) or 0
    )

    return {
        "pipeline": {
            "generation": {
                "total": total_jobs,
                "completed": completed_jobs,
                "active": active_jobs,
            },
            "feedback": {
                "total": total_feedback,
                "rated_samples": rated_samples,
                "pending": pending_feedback,
            },
            "dataset": {
                "total": total_datasets,
                "exported": exported_datasets,
            },
            "training": {
                "total": total_experiments,
                "running": running_experiments,
            },
        },
        "quick_stats": {
            "total_generations": completed_jobs,
            "total_samples": total_samples,
            "avg_rating": round(avg_rating, 2) if avg_rating else None,
            "active_adapters": active_adapters,
            "total_adapters": total_adapters,
            "pending_feedback": pending_feedback,
        },
    }


@router.get("/feedback")
async def get_feedback_metrics(
    db: AsyncSession = Depends(get_db),
):
    """Get detailed feedback distribution metrics."""
    # Rating distribution
    rating_dist = {}
    for rating in range(1, 6):
        count = (
            await db.scalar(select(func.count()).where(Feedback.rating == rating)) or 0
        )
        rating_dist[rating] = count

    # Feedback by adapter
    adapter_feedback = await db.execute(
        select(
            AudioSample.adapter_id,
            func.count(Feedback.id).label("count"),
            func.avg(Feedback.rating).label("avg_rating"),
        )
        .join(Feedback, Feedback.audio_id == AudioSample.id)
        .group_by(AudioSample.adapter_id)
    )

    by_adapter = []
    for row in adapter_feedback:
        adapter_name = "Base Model"
        if row.adapter_id:
            adapter = await db.execute(
                select(Adapter).where(Adapter.id == row.adapter_id)
            )
            a = adapter.scalar_one_or_none()
            if a:
                adapter_name = f"{a.name} v{a.version}"

        by_adapter.append(
            {
                "adapter_id": str(row.adapter_id) if row.adapter_id else None,
                "adapter_name": adapter_name,
                "count": row.count,
                "avg_rating": round(row.avg_rating, 2) if row.avg_rating else None,
            }
        )

    # Preference feedback count
    preference_count = (
        await db.scalar(select(func.count()).where(Feedback.preferred_over.isnot(None)))
        or 0
    )

    # Total with tags
    tagged_count = (
        await db.scalar(select(func.count()).where(Feedback.tags.isnot(None))) or 0
    )

    return {
        "rating_distribution": rating_dist,
        "by_adapter": by_adapter,
        "preference_comparisons": preference_count,
        "tagged_feedback": tagged_count,
    }
