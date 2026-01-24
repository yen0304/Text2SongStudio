from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class FeedbackCreate(BaseModel):
    audio_id: UUID
    rating: float | None = Field(None, ge=1, le=5)
    rating_criterion: str | None = "overall"
    preferred_over: UUID | None = None
    tags: list[str] | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_feedback_type(self):
        if self.rating is None and self.preferred_over is None and not self.tags:
            raise ValueError("Feedback must include rating, preference, or tags")
        return self


class FeedbackResponse(BaseModel):
    id: UUID
    audio_id: UUID
    user_id: UUID | None
    rating: float | None
    rating_criterion: str | None
    preferred_over: UUID | None
    tags: list[str] | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int


class FeedbackStatsResponse(BaseModel):
    audio_id: UUID | None = None
    adapter_id: UUID | None = None
    average_rating: float | None
    rating_count: int
    preference_wins: int
    preference_losses: int
    win_rate: float | None
    common_tags: list[dict]
