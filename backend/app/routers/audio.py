from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import AudioSample
from app.schemas import AudioSampleResponse, AudioCompareRequest, AudioCompareResponse
from app.services.storage import StorageService

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/{audio_id}", response_model=AudioSampleResponse)
async def get_audio_metadata(
    audio_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AudioSample).where(AudioSample.id == audio_id))
    sample = result.scalar_one_or_none()

    if not sample:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    return AudioSampleResponse(
        id=sample.id,
        prompt_id=sample.prompt_id,
        adapter_id=sample.adapter_id,
        duration_seconds=sample.duration_seconds,
        sample_rate=sample.sample_rate,
        generation_params=sample.generation_params,
        created_at=sample.created_at,
    )


@router.get("/{audio_id}/stream")
async def stream_audio(
    audio_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AudioSample).where(AudioSample.id == audio_id))
    sample = result.scalar_one_or_none()

    if not sample:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    storage = StorageService()

    async def audio_stream():
        async for chunk in storage.stream_file(sample.storage_path):
            yield chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/wav",
        headers={
            "Content-Disposition": f"inline; filename={audio_id}.wav",
            "Accept-Ranges": "bytes",
        },
    )


@router.post("/compare", response_model=AudioCompareResponse)
async def compare_audio(
    data: AudioCompareRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AudioSample).where(AudioSample.id.in_(data.audio_ids))
    )
    samples = result.scalars().all()

    if len(samples) != len(data.audio_ids):
        found_ids = {s.id for s in samples}
        missing = [str(aid) for aid in data.audio_ids if aid not in found_ids]
        raise HTTPException(
            status_code=404,
            detail=f"Audio samples not found: {', '.join(missing)}",
        )

    return AudioCompareResponse(
        samples=[
            AudioSampleResponse(
                id=s.id,
                prompt_id=s.prompt_id,
                adapter_id=s.adapter_id,
                duration_seconds=s.duration_seconds,
                sample_rate=s.sample_rate,
                generation_params=s.generation_params,
                created_at=s.created_at,
            )
            for s in samples
        ]
    )
