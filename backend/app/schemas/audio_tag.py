"""Schemas for Audio Tags."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AudioTagCreate(BaseModel):
    """Create a tag for an audio sample."""

    audio_id: UUID
    tag: str = Field(..., min_length=1, max_length=100)
    is_positive: bool = Field(
        default=True,
        description="True for positive attributes (good_melody), False for negative (noisy)",
    )


class AudioTagResponse(BaseModel):
    """Response for an audio tag."""

    id: UUID
    audio_id: UUID
    user_id: UUID | None
    tag: str
    is_positive: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AudioTagListResponse(BaseModel):
    """Paginated list of audio tags."""

    items: list[AudioTagResponse]
    total: int


class AudioTagBulkCreate(BaseModel):
    """Bulk create tags for an audio sample."""

    audio_id: UUID
    positive_tags: list[str] = Field(default_factory=list)
    negative_tags: list[str] = Field(default_factory=list)


class AudioTagBulkUpdate(BaseModel):
    """Replace all tags for an audio sample (used in PUT endpoint)."""

    positive_tags: list[str] = Field(default_factory=list)
    negative_tags: list[str] = Field(default_factory=list)


class AudioTagStats(BaseModel):
    """Statistics for audio tags."""

    total_tags: int
    positive_count: int
    negative_count: int
    tag_frequency: dict[str, int]  # tag -> count
    top_positive_tags: list[tuple[str, int]]
    top_negative_tags: list[tuple[str, int]]


class AvailableTagsResponse(BaseModel):
    """List of available/suggested tags."""

    positive_tags: list[str]
    negative_tags: list[str]
