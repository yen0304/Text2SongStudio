from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class TargetType(str, Enum):
    """Types of entities that can be favorited."""

    PROMPT = "prompt"
    AUDIO = "audio"


class FavoriteCreate(BaseModel):
    """Schema for creating a new favorite."""

    target_type: TargetType
    target_id: UUID
    note: str | None = Field(None, max_length=500)


class FavoriteUpdate(BaseModel):
    """Schema for updating a favorite's note."""

    note: str | None = Field(None, max_length=500)


class FavoriteResponse(BaseModel):
    """Schema for favorite response."""

    id: UUID
    target_type: str
    target_id: UUID
    user_id: UUID | None
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteWithDetailsResponse(BaseModel):
    """Schema for favorite with target entity details."""

    id: UUID
    target_type: str
    target_id: UUID
    user_id: UUID | None
    note: str | None
    created_at: datetime
    # Details populated based on target_type
    target_preview: str | None = None  # prompt text or audio storage path
    target_created_at: datetime | None = None

    class Config:
        from_attributes = True


class FavoriteListResponse(BaseModel):
    """Schema for paginated favorite list response."""

    items: list[FavoriteWithDetailsResponse]
    total: int
    page: int
    limit: int
