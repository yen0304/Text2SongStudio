from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GenerationRequest(BaseModel):
    prompt_id: UUID
    num_samples: int = Field(1, ge=1, le=4)
    adapter_id: UUID | None = None
    seed: int | None = None
    temperature: float = Field(1.0, ge=0.1, le=2.0)
    top_k: int = Field(250, ge=1, le=1000)
    top_p: float = Field(0.0, ge=0.0, le=1.0)
    duration: int | None = Field(None, ge=1)  # No max limit, user chooses freely


class GenerationJobResponse(BaseModel):
    id: UUID
    status: str
    progress: float | None = None
    audio_ids: list[UUID] | None = None
    error: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Job Feedback Schemas
class SampleFeedbackItem(BaseModel):
    """Individual feedback record for a sample."""

    id: UUID
    rating: float | None
    rating_criterion: str | None
    preferred_over: UUID | None
    tags: list[str] | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SampleFeedbackGroup(BaseModel):
    """Feedback grouped by audio sample."""

    audio_id: UUID
    label: str  # A, B, C, D...
    feedback: list[SampleFeedbackItem]
    average_rating: float | None = None
    feedback_count: int = 0
    tags: list[str] | None = None  # Audio tags from AudioTag table


class JobFeedbackResponse(BaseModel):
    """Response for GET /generate/{job_id}/feedback."""

    job_id: UUID
    prompt_id: UUID
    total_samples: int
    total_feedback: int
    average_rating: float | None
    samples: list[SampleFeedbackGroup]
