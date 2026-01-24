from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Prompt, GenerationJob, JobStatus
from app.schemas import GenerationRequest, GenerationJobResponse
from app.services.generation import GenerationService

router = APIRouter(prefix="/generate", tags=["generation"])


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
        raise HTTPException(status_code=400, detail="Cannot cancel completed or failed job")

    job.status = JobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    await db.commit()

    # Signal cancellation to generation service
    GenerationService.cancel_job(job_id)
