"""Schemas for Quality Rating (SFT training data)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class QualityRatingCreate(BaseModel):
    """Create a quality rating for an audio sample."""

    audio_id: UUID
    rating: float = Field(..., ge=1, le=5, description="Rating from 1-5")
    criterion: str = Field(
        default="overall",
        description="What aspect is being rated: overall, melody, rhythm, harmony, coherence, creativity",
    )
    notes: str | None = None


class QualityRatingResponse(BaseModel):
    """Response for a quality rating."""

    id: UUID
    audio_id: UUID
    user_id: UUID | None
    rating: float
    criterion: str
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class QualityRatingListResponse(BaseModel):
    """Paginated list of quality ratings."""

    items: list[QualityRatingResponse]
    total: int


class QualityRatingStats(BaseModel):
    """Statistics for quality ratings."""

    audio_id: UUID | None = None
    total_ratings: int
    average_rating: float | None
    rating_by_criterion: dict[str, float]  # criterion -> avg rating
    rating_distribution: dict[int, int]  # rating (1-5) -> count
