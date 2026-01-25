from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Adapter, GenerationJob, JobStatus, Prompt

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    status: str | None = Query(None, description="Filter by status"),
    adapter_id: UUID | None = Query(None, description="Filter by adapter"),
    start_date: datetime | None = Query(None, description="Filter by start date"),
    end_date: datetime | None = Query(None, description="Filter by end date"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all generation jobs with optional filtering."""
    query = select(GenerationJob)

    if status:
        query = query.where(GenerationJob.status == status)

    if adapter_id:
        query = query.where(GenerationJob.adapter_id == adapter_id)

    if start_date:
        query = query.where(GenerationJob.created_at >= start_date)

    if end_date:
        query = query.where(GenerationJob.created_at <= end_date)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Get items with ordering
    query = query.order_by(GenerationJob.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    # Enrich with prompt and adapter info
    items = []
    for job in jobs:
        # Get prompt text preview
        prompt_preview = None
        if job.prompt_id:
            prompt_result = await db.execute(
                select(Prompt).where(Prompt.id == job.prompt_id)
            )
            prompt = prompt_result.scalar_one_or_none()
            if prompt and prompt.text:
                prompt_preview = (
                    prompt.text[:80] + "..." if len(prompt.text) > 80 else prompt.text
                )

        # Get adapter name
        adapter_name = None
        if job.adapter_id:
            adapter_result = await db.execute(
                select(Adapter).where(Adapter.id == job.adapter_id)
            )
            adapter = adapter_result.scalar_one_or_none()
            if adapter:
                adapter_name = f"{adapter.name} v{adapter.version}"

        # Calculate duration
        duration_seconds = None
        if job.completed_at and job.created_at:
            duration_seconds = (job.completed_at - job.created_at).total_seconds()
        elif job.status in [JobStatus.PROCESSING, JobStatus.QUEUED]:
            duration_seconds = (datetime.utcnow() - job.created_at).total_seconds()

        items.append(
            {
                "id": str(job.id),
                "prompt_id": str(job.prompt_id) if job.prompt_id else None,
                "prompt_preview": prompt_preview,
                "adapter_id": str(job.adapter_id) if job.adapter_id else None,
                "adapter_name": adapter_name,
                "status": job.status.value,
                "progress": job.progress,
                "num_samples": job.num_samples,
                "audio_ids": [str(aid) for aid in (job.audio_ids or [])],
                "error": job.error,
                "duration_seconds": duration_seconds,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat()
                if job.completed_at
                else None,
            }
        )

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/stats")
async def get_job_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get queue statistics."""
    # Count by status
    status_counts = {}
    for status in JobStatus:
        count_query = select(func.count()).where(GenerationJob.status == status)
        count = await db.scalar(count_query) or 0
        status_counts[status.value] = count

    # Calculate average processing time for completed jobs (last 100)
    completed_jobs = await db.execute(
        select(GenerationJob)
        .where(GenerationJob.status == JobStatus.COMPLETED)
        .where(GenerationJob.completed_at.isnot(None))
        .order_by(GenerationJob.completed_at.desc())
        .limit(100)
    )
    jobs = completed_jobs.scalars().all()

    avg_processing_time = None
    if jobs:
        durations = [
            (j.completed_at - j.created_at).total_seconds()
            for j in jobs
            if j.completed_at
        ]
        if durations:
            avg_processing_time = sum(durations) / len(durations)

    # Jobs in last 24 hours
    yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = (
        await db.scalar(
            select(func.count()).where(GenerationJob.created_at >= yesterday)
        )
        or 0
    )

    # Active jobs (queued + processing)
    active_count = status_counts.get("queued", 0) + status_counts.get("processing", 0)

    return {
        "status_counts": status_counts,
        "active_jobs": active_count,
        "avg_processing_time_seconds": avg_processing_time,
        "jobs_today": today_count,
        "total_jobs": sum(status_counts.values()),
    }
