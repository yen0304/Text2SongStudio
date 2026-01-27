"""API endpoints for Audio Tags."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import NEGATIVE_TAGS, POSITIVE_TAGS, AudioSample, AudioTag
from app.schemas import (
    AudioTagBulkCreate,
    AudioTagBulkUpdate,
    AudioTagCreate,
    AudioTagListResponse,
    AudioTagResponse,
    AudioTagStats,
    AvailableTagsResponse,
)

router = APIRouter(prefix="/tags", tags=["audio-tags"])


@router.get("/available", response_model=AvailableTagsResponse)
async def get_available_tags():
    """Get list of suggested/available tags."""
    return AvailableTagsResponse(
        positive_tags=POSITIVE_TAGS,
        negative_tags=NEGATIVE_TAGS,
    )


@router.post("", response_model=AudioTagResponse, status_code=201)
async def create_tag(
    data: AudioTagCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a tag for an audio sample."""
    # Verify audio exists
    result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.audio_id)
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    # Check if tag already exists for this audio
    existing = await db.execute(
        select(AudioTag).where(
            AudioTag.audio_id == data.audio_id,
            AudioTag.tag == data.tag,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tag already exists for this audio")

    tag = AudioTag(
        audio_id=data.audio_id,
        tag=data.tag,
        is_positive=data.is_positive,
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return AudioTagResponse.model_validate(tag)


@router.post("/bulk", response_model=list[AudioTagResponse], status_code=201)
async def create_tags_bulk(
    data: AudioTagBulkCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple tags for an audio sample at once."""
    # Verify audio exists
    result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.audio_id)
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    created_tags = []

    # Add positive tags
    for tag_name in data.positive_tags:
        tag = AudioTag(
            audio_id=data.audio_id,
            tag=tag_name,
            is_positive=True,
        )
        db.add(tag)
        created_tags.append(tag)

    # Add negative tags
    for tag_name in data.negative_tags:
        tag = AudioTag(
            audio_id=data.audio_id,
            tag=tag_name,
            is_positive=False,
        )
        db.add(tag)
        created_tags.append(tag)

    try:
        await db.commit()
        for tag in created_tags:
            await db.refresh(tag)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Some tags already exist")

    return [AudioTagResponse.model_validate(t) for t in created_tags]


@router.get("", response_model=AudioTagListResponse)
async def list_tags(
    audio_id: UUID | None = Query(None),
    tag: str | None = Query(None),
    is_positive: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List audio tags with optional filters."""
    query = select(AudioTag)

    if audio_id:
        query = query.where(AudioTag.audio_id == audio_id)
    if tag:
        query = query.where(AudioTag.tag == tag)
    if is_positive is not None:
        query = query.where(AudioTag.is_positive == is_positive)

    query = query.order_by(AudioTag.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    tags = result.scalars().all()

    return AudioTagListResponse(
        items=[AudioTagResponse.model_validate(t) for t in tags],
        total=total,
    )


@router.get("/stats", response_model=AudioTagStats)
async def get_tag_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for audio tags."""
    # Total tags
    total_result = await db.execute(select(func.count(AudioTag.id)))
    total_tags = total_result.scalar() or 0

    # Positive/negative counts
    positive_result = await db.execute(
        select(func.count(AudioTag.id)).where(AudioTag.is_positive.is_(True))
    )
    positive_count = positive_result.scalar() or 0

    negative_result = await db.execute(
        select(func.count(AudioTag.id)).where(AudioTag.is_positive.is_(False))
    )
    negative_count = negative_result.scalar() or 0

    # Tag frequency
    freq_result = await db.execute(
        select(AudioTag.tag, func.count(AudioTag.id))
        .group_by(AudioTag.tag)
        .order_by(func.count(AudioTag.id).desc())
    )
    tag_frequency = {row[0]: row[1] for row in freq_result.all()}

    # Top positive tags
    top_pos_result = await db.execute(
        select(AudioTag.tag, func.count(AudioTag.id))
        .where(AudioTag.is_positive.is_(True))
        .group_by(AudioTag.tag)
        .order_by(func.count(AudioTag.id).desc())
        .limit(10)
    )
    top_positive_tags = [(row[0], row[1]) for row in top_pos_result.all()]

    # Top negative tags
    top_neg_result = await db.execute(
        select(AudioTag.tag, func.count(AudioTag.id))
        .where(AudioTag.is_positive.is_(False))
        .group_by(AudioTag.tag)
        .order_by(func.count(AudioTag.id).desc())
        .limit(10)
    )
    top_negative_tags = [(row[0], row[1]) for row in top_neg_result.all()]

    return AudioTagStats(
        total_tags=total_tags,
        positive_count=positive_count,
        negative_count=negative_count,
        tag_frequency=tag_frequency,
        top_positive_tags=top_positive_tags,
        top_negative_tags=top_negative_tags,
    )


@router.get("/audio/{audio_id}", response_model=AudioTagListResponse)
async def get_tags_for_audio(
    audio_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all tags for a specific audio sample."""
    # Verify audio exists
    result = await db.execute(select(AudioSample).where(AudioSample.id == audio_id))
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    # Get tags
    result = await db.execute(
        select(AudioTag)
        .where(AudioTag.audio_id == audio_id)
        .order_by(AudioTag.created_at.desc())
    )
    tags = result.scalars().all()

    return AudioTagListResponse(
        items=[AudioTagResponse.model_validate(t) for t in tags],
        total=len(tags),
    )


@router.put("/audio/{audio_id}", response_model=list[AudioTagResponse])
async def replace_tags_for_audio(
    audio_id: UUID,
    data: AudioTagBulkUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Replace all tags for an audio sample with new ones."""
    # Verify audio exists
    result = await db.execute(select(AudioSample).where(AudioSample.id == audio_id))
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    # Delete existing tags for this audio
    existing_tags = await db.execute(
        select(AudioTag).where(AudioTag.audio_id == audio_id)
    )
    for tag in existing_tags.scalars().all():
        await db.delete(tag)

    # Create new tags
    created_tags = []

    # Add positive tags
    for tag_name in data.positive_tags:
        tag = AudioTag(
            audio_id=audio_id,
            tag=tag_name,
            is_positive=True,
        )
        db.add(tag)
        created_tags.append(tag)

    # Add negative tags
    for tag_name in data.negative_tags:
        tag = AudioTag(
            audio_id=audio_id,
            tag=tag_name,
            is_positive=False,
        )
        db.add(tag)
        created_tags.append(tag)

    await db.commit()
    for tag in created_tags:
        await db.refresh(tag)

    return [AudioTagResponse.model_validate(t) for t in created_tags]


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an audio tag."""
    result = await db.execute(select(AudioTag).where(AudioTag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
