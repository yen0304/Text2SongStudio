from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AudioSample, Favorite, Prompt
from app.schemas import (
    FavoriteCreate,
    FavoriteListResponse,
    FavoriteResponse,
    FavoriteUpdate,
    FavoriteWithDetailsResponse,
    TargetType,
)

router = APIRouter(prefix="/favorites", tags=["favorites"])


async def validate_target_exists(
    db: AsyncSession, target_type: TargetType, target_id: UUID
) -> bool:
    """Validate that the target entity exists."""
    if target_type == TargetType.PROMPT:
        result = await db.execute(select(Prompt).where(Prompt.id == target_id))
    elif target_type == TargetType.AUDIO:
        result = await db.execute(
            select(AudioSample).where(AudioSample.id == target_id)
        )
    else:
        return False
    return result.scalar_one_or_none() is not None


@router.post("", response_model=FavoriteResponse, status_code=201)
async def create_favorite(
    data: FavoriteCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add an item to favorites."""
    # Validate target exists
    if not await validate_target_exists(db, data.target_type, data.target_id):
        raise HTTPException(
            status_code=404, detail=f"{data.target_type.value.capitalize()} not found"
        )

    # Check if already favorited
    existing = await db.execute(
        select(Favorite).where(
            Favorite.target_type == data.target_type.value,
            Favorite.target_id == data.target_id,
            Favorite.user_id.is_(None),  # TODO: Match current user when auth available
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Item is already in favorites")

    favorite = Favorite(
        target_type=data.target_type.value,
        target_id=data.target_id,
        user_id=None,  # TODO: Set from auth context when available
        note=data.note,
        created_at=datetime.utcnow(),
    )
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)

    return FavoriteResponse(
        id=favorite.id,
        target_type=favorite.target_type,
        target_id=favorite.target_id,
        user_id=favorite.user_id,
        note=favorite.note,
        created_at=favorite.created_at,
    )


@router.get("/{favorite_id}", response_model=FavoriteResponse)
async def get_favorite(
    favorite_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a favorite by ID."""
    result = await db.execute(select(Favorite).where(Favorite.id == favorite_id))
    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    return FavoriteResponse(
        id=favorite.id,
        target_type=favorite.target_type,
        target_id=favorite.target_id,
        user_id=favorite.user_id,
        note=favorite.note,
        created_at=favorite.created_at,
    )


@router.get("", response_model=FavoriteListResponse)
async def list_favorites(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    target_type: TargetType | None = Query(None, description="Filter by target type"),
    db: AsyncSession = Depends(get_db),
):
    """List favorites with optional filtering and target details."""
    offset = (page - 1) * limit

    # Build query with filters
    query = select(Favorite)
    count_query = select(func.count(Favorite.id))

    if target_type is not None:
        query = query.where(Favorite.target_type == target_type.value)
        count_query = count_query.where(Favorite.target_type == target_type.value)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get favorites
    result = await db.execute(
        query.order_by(Favorite.created_at.desc()).offset(offset).limit(limit)
    )
    favorites = result.scalars().all()

    # Fetch target details
    items = []
    for fav in favorites:
        target_preview = None
        target_created_at = None

        if fav.target_type == "prompt":
            prompt_result = await db.execute(
                select(Prompt).where(Prompt.id == fav.target_id)
            )
            prompt = prompt_result.scalar_one_or_none()
            if prompt:
                # Truncate text for preview
                target_preview = (
                    prompt.text[:100] + "..." if len(prompt.text) > 100 else prompt.text
                )
                target_created_at = prompt.created_at
        elif fav.target_type == "audio":
            audio_result = await db.execute(
                select(AudioSample).where(AudioSample.id == fav.target_id)
            )
            audio = audio_result.scalar_one_or_none()
            if audio:
                target_preview = audio.storage_path
                target_created_at = audio.created_at

        items.append(
            FavoriteWithDetailsResponse(
                id=fav.id,
                target_type=fav.target_type,
                target_id=fav.target_id,
                user_id=fav.user_id,
                note=fav.note,
                created_at=fav.created_at,
                target_preview=target_preview,
                target_created_at=target_created_at,
            )
        )

    return FavoriteListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )


@router.put("/{favorite_id}", response_model=FavoriteResponse)
async def update_favorite(
    favorite_id: UUID,
    data: FavoriteUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a favorite's note."""
    result = await db.execute(select(Favorite).where(Favorite.id == favorite_id))
    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    if data.note is not None:
        favorite.note = data.note

    await db.commit()
    await db.refresh(favorite)

    return FavoriteResponse(
        id=favorite.id,
        target_type=favorite.target_type,
        target_id=favorite.target_id,
        user_id=favorite.user_id,
        note=favorite.note,
        created_at=favorite.created_at,
    )


@router.delete("/{favorite_id}", status_code=204)
async def delete_favorite(
    favorite_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from favorites."""
    result = await db.execute(select(Favorite).where(Favorite.id == favorite_id))
    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    await db.delete(favorite)
    await db.commit()


@router.delete("/by-target/{target_type}/{target_id}", status_code=204)
async def delete_favorite_by_target(
    target_type: TargetType,
    target_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from favorites by target type and ID."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.target_type == target_type.value,
            Favorite.target_id == target_id,
            Favorite.user_id.is_(None),  # TODO: Match current user when auth available
        )
    )
    favorite = result.scalar_one_or_none()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    await db.delete(favorite)
    await db.commit()


@router.get("/check/{target_type}/{target_id}", response_model=FavoriteResponse | None)
async def check_favorite(
    target_type: TargetType,
    target_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Check if an item is favorited. Returns the favorite if exists, null otherwise."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.target_type == target_type.value,
            Favorite.target_id == target_id,
            Favorite.user_id.is_(None),  # TODO: Match current user when auth available
        )
    )
    favorite = result.scalar_one_or_none()

    if not favorite:
        return None

    return FavoriteResponse(
        id=favorite.id,
        target_type=favorite.target_type,
        target_id=favorite.target_id,
        user_id=favorite.user_id,
        note=favorite.note,
        created_at=favorite.created_at,
    )
