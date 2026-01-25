from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AudioSample, Feedback, GenerationJob
from app.schemas import (
    FeedbackCreate,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackStatsResponse,
    FeedbackSummaryResponse,
)

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/summary", response_model=FeedbackSummaryResponse)
async def get_feedback_summary(
    db: AsyncSession = Depends(get_db),
):
    """Get overall feedback statistics for the training dashboard."""
    # Total feedback
    total_result = await db.execute(select(func.count()).select_from(Feedback))
    total_feedback = total_result.scalar() or 0

    # Total ratings
    rating_result = await db.execute(
        select(func.count()).where(Feedback.rating.isnot(None))
    )
    total_ratings = rating_result.scalar() or 0

    # Total preferences
    pref_result = await db.execute(
        select(func.count()).where(Feedback.preferred_over.isnot(None))
    )
    total_preferences = pref_result.scalar() or 0

    # Rating distribution
    ratings_result = await db.execute(
        select(Feedback.rating).where(Feedback.rating.isnot(None))
    )
    ratings = [r[0] for r in ratings_result.fetchall()]
    rating_distribution = {}
    for r in ratings:
        key = str(int(r))
        rating_distribution[key] = rating_distribution.get(key, 0) + 1

    # High rated samples (4+)
    high_rated_result = await db.execute(
        select(func.count()).where(Feedback.rating >= 4)
    )
    high_rated_samples = high_rated_result.scalar() or 0

    return FeedbackSummaryResponse(
        total_feedback=total_feedback,
        total_ratings=total_ratings,
        total_preferences=total_preferences,
        rating_distribution=rating_distribution,
        high_rated_samples=high_rated_samples,
    )


@router.post("", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    # Verify audio sample exists
    result = await db.execute(
        select(AudioSample).where(AudioSample.id == data.audio_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Audio sample not found")

    # Verify preferred_over sample exists if provided
    if data.preferred_over:
        result = await db.execute(
            select(AudioSample).where(AudioSample.id == data.preferred_over)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=404, detail="Preferred-over audio sample not found"
            )

    feedback = Feedback(
        audio_id=data.audio_id,
        rating=data.rating,
        rating_criterion=data.rating_criterion,
        preferred_over=data.preferred_over,
        tags=data.tags or [],
        notes=data.notes,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        audio_id=feedback.audio_id,
        user_id=feedback.user_id,
        rating=feedback.rating,
        rating_criterion=feedback.rating_criterion,
        preferred_over=feedback.preferred_over,
        tags=feedback.tags,
        notes=feedback.notes,
        created_at=feedback.created_at,
    )


@router.get("", response_model=FeedbackListResponse)
async def list_feedback(
    audio_id: UUID | None = None,
    user_id: UUID | None = None,
    job_id: UUID | None = None,
    min_rating: float | None = Query(None, ge=1, le=5),
    max_rating: float | None = Query(None, ge=1, le=5),
    tags: list[str] | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Feedback)

    if audio_id:
        query = query.where(Feedback.audio_id == audio_id)
    if user_id:
        query = query.where(Feedback.user_id == user_id)
    if job_id:
        # Filter by job_id through GenerationJob.audio_ids
        job_result = await db.execute(
            select(GenerationJob).where(GenerationJob.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        if job and job.audio_ids:
            query = query.where(Feedback.audio_id.in_(job.audio_ids))
        else:
            # No job or no audio_ids, return empty result
            return FeedbackListResponse(items=[], total=0)
    if min_rating is not None:
        query = query.where(Feedback.rating >= min_rating)
    if max_rating is not None:
        query = query.where(Feedback.rating <= max_rating)
    if tags:
        query = query.where(Feedback.tags.contains(tags))

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    offset = (page - 1) * limit
    query = query.order_by(Feedback.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    feedbacks = result.scalars().all()

    return FeedbackListResponse(
        items=[
            FeedbackResponse(
                id=f.id,
                audio_id=f.audio_id,
                user_id=f.user_id,
                rating=f.rating,
                rating_criterion=f.rating_criterion,
                preferred_over=f.preferred_over,
                tags=f.tags,
                notes=f.notes,
                created_at=f.created_at,
            )
            for f in feedbacks
        ],
        total=total,
    )


@router.get("/stats", response_model=FeedbackStatsResponse)
async def get_feedback_stats(
    audio_id: UUID | None = None,
    adapter_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    # Build base query
    base_query = select(Feedback)

    if audio_id:
        base_query = base_query.where(Feedback.audio_id == audio_id)
    elif adapter_id:
        base_query = base_query.join(AudioSample).where(
            AudioSample.adapter_id == adapter_id
        )

    # Get ratings
    rating_query = base_query.where(Feedback.rating.isnot(None))
    rating_result = await db.execute(rating_query)
    ratings = [f.rating for f in rating_result.scalars().all()]

    avg_rating = sum(ratings) / len(ratings) if ratings else None
    rating_count = len(ratings)

    # Get preference wins/losses
    if audio_id:
        wins_result = await db.execute(
            select(func.count())
            .where(Feedback.audio_id == audio_id)
            .where(Feedback.preferred_over.isnot(None))
        )
        wins = wins_result.scalar()

        losses_result = await db.execute(
            select(func.count()).where(Feedback.preferred_over == audio_id)
        )
        losses = losses_result.scalar()
    else:
        wins = 0
        losses = 0

    win_rate = wins / (wins + losses) if (wins + losses) > 0 else None

    # Get tag frequency
    all_tags_result = await db.execute(base_query)
    all_tags = []
    for f in all_tags_result.scalars().all():
        if f.tags:
            all_tags.extend(f.tags)

    tag_counts = {}
    for tag in all_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1

    common_tags = [
        {"tag": tag, "count": count}
        for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[
            :10
        ]
    ]

    return FeedbackStatsResponse(
        audio_id=audio_id,
        adapter_id=adapter_id,
        average_rating=avg_rating,
        rating_count=rating_count,
        preference_wins=wins,
        preference_losses=losses,
        win_rate=win_rate,
        common_tags=common_tags,
    )
