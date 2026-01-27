"""API endpoints for Quality Ratings (SFT training data)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AudioSample, QualityRating
from app.schemas import (
    QualityRatingCreate,
    QualityRatingListResponse,
    QualityRatingResponse,
    QualityRatingStats,
)

router = APIRouter(prefix="/ratings", tags=["quality-ratings"])


@router.post("", response_model=QualityRatingResponse, status_code=201)
async def create_rating(
    data: QualityRatingCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a quality rating for an audio sample."""
    # Verify audio exists
    result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.audio_id)
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio sample not found")

    rating = QualityRating(
        audio_id=data.audio_id,
        rating=data.rating,
        criterion=data.criterion,
        notes=data.notes,
    )
    db.add(rating)
    await db.commit()
    await db.refresh(rating)

    return QualityRatingResponse.model_validate(rating)


@router.get("", response_model=QualityRatingListResponse)
async def list_ratings(
    audio_id: UUID | None = Query(None),
    criterion: str | None = Query(None),
    min_rating: float | None = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List quality ratings with optional filters."""
    query = select(QualityRating)

    if audio_id:
        query = query.where(QualityRating.audio_id == audio_id)
    if criterion:
        query = query.where(QualityRating.criterion == criterion)
    if min_rating is not None:
        query = query.where(QualityRating.rating >= min_rating)

    query = query.order_by(QualityRating.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    ratings = result.scalars().all()

    return QualityRatingListResponse(
        items=[QualityRatingResponse.model_validate(r) for r in ratings],
        total=total,
    )


@router.get("/stats", response_model=QualityRatingStats)
async def get_rating_stats(
    audio_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for quality ratings."""
    base_query = select(QualityRating)
    if audio_id:
        base_query = base_query.where(QualityRating.audio_id == audio_id)

    # Total count
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total_ratings = count_result.scalar() or 0

    # Average rating
    avg_result = await db.execute(
        select(func.avg(QualityRating.rating)).select_from(base_query.subquery())
    )
    average_rating = avg_result.scalar()

    # Rating by criterion
    criterion_query = select(
        QualityRating.criterion, func.avg(QualityRating.rating)
    ).group_by(QualityRating.criterion)
    if audio_id:
        criterion_query = criterion_query.where(QualityRating.audio_id == audio_id)

    criterion_result = await db.execute(criterion_query)
    rating_by_criterion = {row[0]: float(row[1]) for row in criterion_result.all()}

    # Rating distribution
    dist_query = select(
        func.floor(QualityRating.rating).cast(int).label("rating_bucket"),
        func.count().label("count"),
    ).group_by("rating_bucket")
    if audio_id:
        dist_query = dist_query.where(QualityRating.audio_id == audio_id)

    dist_result = await db.execute(dist_query)
    rating_distribution = {int(row[0]): row[1] for row in dist_result.all()}

    return QualityRatingStats(
        audio_id=audio_id,
        total_ratings=total_ratings,
        average_rating=float(average_rating) if average_rating else None,
        rating_by_criterion=rating_by_criterion,
        rating_distribution=rating_distribution,
    )


@router.delete("/{rating_id}", status_code=204)
async def delete_rating(
    rating_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a quality rating."""
    result = await db.execute(
        select(QualityRating).where(QualityRating.id == rating_id)
    )
    rating = result.scalar_one_or_none()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    await db.delete(rating)
    await db.commit()
