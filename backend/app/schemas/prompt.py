from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class PromptAttributes(BaseModel):
    style: str | None = None
    tempo: int | None = Field(None, ge=40, le=200)
    instrumentation: list[str] | None = None
    mood: str | None = None
    duration: int | None = Field(None, ge=1, le=30)


class PromptCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    attributes: PromptAttributes | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        return v.strip()


class PromptResponse(BaseModel):
    id: UUID
    text: str
    attributes: dict | None
    created_at: datetime
    audio_sample_ids: list[UUID] = []

    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    items: list[PromptResponse]
    total: int
    page: int
    limit: int
