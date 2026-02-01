from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.prompt import PromptAttributes


class TemplateCreate(BaseModel):
    """Schema for creating a new prompt template."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    text: str = Field(..., min_length=1, max_length=2000)
    attributes: PromptAttributes | None = None
    category: str | None = Field(None, max_length=50)


class TemplateUpdate(BaseModel):
    """Schema for updating an existing template."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    text: str | None = Field(None, min_length=1, max_length=2000)
    attributes: PromptAttributes | None = None
    category: str | None = Field(None, max_length=50)


class TemplateResponse(BaseModel):
    """Schema for template response."""

    id: UUID
    name: str
    description: str | None
    text: str
    attributes: dict | None
    category: str | None
    is_system: bool
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for paginated template list response."""

    items: list[TemplateResponse]
    total: int
    page: int
    limit: int
