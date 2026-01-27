"""API endpoints for Preference Pairs (DPO/RLHF training data)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AudioSample, PreferencePair, Prompt
from app.schemas import (
    PreferencePairCreate,
    PreferencePairListResponse,
    PreferencePairResponse,
    PreferencePairStats,
    PreferencePairWithDetails,
)

router = APIRouter(prefix="/preferences", tags=["preference-pairs"])


@router.post("", response_model=PreferencePairResponse, status_code=201)
async def create_preference(
    data: PreferencePairCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a preference pair indicating which audio is better."""
    # Verify prompt exists
    prompt_result = await db.execute(select(Prompt).where(Prompt.id == data.prompt_id))
    prompt = prompt_result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Verify both audios exist and belong to the same prompt
    chosen_result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.chosen_audio_id)
    )
    chosen = chosen_result.scalar_one_or_none()
    if not chosen:
        raise HTTPException(status_code=404, detail="Chosen audio not found")
    if chosen.prompt_id != data.prompt_id:
        raise HTTPException(
            status_code=400,
            detail="Chosen audio does not belong to the specified prompt",
        )

    rejected_result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.rejected_audio_id)
    )
    rejected = rejected_result.scalar_one_or_none()
    if not rejected:
        raise HTTPException(status_code=404, detail="Rejected audio not found")
    if rejected.prompt_id != data.prompt_id:
        raise HTTPException(
            status_code=400,
            detail="Rejected audio does not belong to the specified prompt",
        )

    preference = PreferencePair(
        prompt_id=data.prompt_id,
        chosen_audio_id=data.chosen_audio_id,
        rejected_audio_id=data.rejected_audio_id,
        margin=data.margin,
        notes=data.notes,
    )
    db.add(preference)
    await db.commit()
    await db.refresh(preference)

    return PreferencePairResponse.model_validate(preference)


@router.get("", response_model=PreferencePairListResponse)
async def list_preferences(
    prompt_id: UUID | None = Query(None),
    audio_id: UUID | None = Query(
        None, description="Filter by audio (chosen or rejected)"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List preference pairs with optional filters."""
    query = select(PreferencePair)

    if prompt_id:
        query = query.where(PreferencePair.prompt_id == prompt_id)
    if audio_id:
        query = query.where(
            (PreferencePair.chosen_audio_id == audio_id)
            | (PreferencePair.rejected_audio_id == audio_id)
        )

    query = query.order_by(PreferencePair.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    preferences = result.scalars().all()

    return PreferencePairListResponse(
        items=[PreferencePairResponse.model_validate(p) for p in preferences],
        total=total,
    )


@router.get("/stats", response_model=PreferencePairStats)
async def get_preference_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for preference pairs."""
    # Total pairs
    count_result = await db.execute(select(func.count(PreferencePair.id)))
    total_pairs = count_result.scalar() or 0

    # Unique prompts
    unique_prompts_result = await db.execute(
        select(func.count(func.distinct(PreferencePair.prompt_id)))
    )
    unique_prompts = unique_prompts_result.scalar() or 0

    # Unique audios (either chosen or rejected)
    # This is a bit complex, so we'll do it differently
    chosen_result = await db.execute(
        select(func.count(func.distinct(PreferencePair.chosen_audio_id)))
    )
    rejected_result = await db.execute(
        select(func.count(func.distinct(PreferencePair.rejected_audio_id)))
    )
    # This is an approximation; exact count would require UNION
    unique_audios = max(chosen_result.scalar() or 0, rejected_result.scalar() or 0)

    # Average margin
    avg_margin_result = await db.execute(
        select(func.avg(PreferencePair.margin)).where(PreferencePair.margin.isnot(None))
    )
    average_margin = avg_margin_result.scalar()

    return PreferencePairStats(
        total_pairs=total_pairs,
        unique_prompts=unique_prompts,
        unique_audios=unique_audios,
        average_margin=float(average_margin) if average_margin else None,
    )


@router.get("/{preference_id}", response_model=PreferencePairWithDetails)
async def get_preference(
    preference_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a preference pair with full details."""
    result = await db.execute(
        select(PreferencePair).where(PreferencePair.id == preference_id)
    )
    preference = result.scalar_one_or_none()
    if not preference:
        raise HTTPException(status_code=404, detail="Preference pair not found")

    # Get related data
    prompt_result = await db.execute(
        select(Prompt).where(Prompt.id == preference.prompt_id)
    )
    prompt = prompt_result.scalar_one_or_none()

    chosen_result = await db.execute(
        select(AudioSample).where(AudioSample.id == preference.chosen_audio_id)
    )
    chosen = chosen_result.scalar_one_or_none()

    rejected_result = await db.execute(
        select(AudioSample).where(AudioSample.id == preference.rejected_audio_id)
    )
    rejected = rejected_result.scalar_one_or_none()

    return PreferencePairWithDetails(
        id=preference.id,
        prompt_id=preference.prompt_id,
        chosen_audio_id=preference.chosen_audio_id,
        rejected_audio_id=preference.rejected_audio_id,
        user_id=preference.user_id,
        margin=preference.margin,
        notes=preference.notes,
        created_at=preference.created_at,
        prompt_text=prompt.text if prompt else None,
        chosen_audio_path=chosen.storage_path if chosen else None,
        rejected_audio_path=rejected.storage_path if rejected else None,
    )


@router.delete("/{preference_id}", status_code=204)
async def delete_preference(
    preference_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a preference pair."""
    result = await db.execute(
        select(PreferencePair).where(PreferencePair.id == preference_id)
    )
    preference = result.scalar_one_or_none()
    if not preference:
        raise HTTPException(status_code=404, detail="Preference pair not found")

    await db.delete(preference)
    await db.commit()
