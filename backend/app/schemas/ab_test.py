from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# A/B Test Schemas
class ABTestCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    adapter_a_id: UUID | None = None  # None = base model
    adapter_b_id: UUID | None = None  # None = base model
    prompt_ids: list[UUID] = []


class ABTestGenerateRequest(BaseModel):
    prompt_ids: list[UUID] | None = None  # Additional prompts to generate
    samples_per_prompt: int = Field(default=1, ge=1, le=4)


class ABTestVoteRequest(BaseModel):
    pair_id: UUID
    preference: str = Field(..., pattern="^(a|b|equal)$")


class ABTestPairResponse(BaseModel):
    id: UUID
    prompt_id: UUID
    audio_a_id: UUID | None = None
    audio_b_id: UUID | None = None
    preference: str | None = None
    voted_at: datetime | None = None
    is_ready: bool = False  # Both audio samples generated

    class Config:
        from_attributes = True


class ABTestResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    adapter_a_id: UUID | None = None
    adapter_b_id: UUID | None = None
    adapter_a_name: str | None = None
    adapter_b_name: str | None = None
    status: str
    total_pairs: int
    completed_pairs: int
    results: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ABTestDetailResponse(ABTestResponse):
    pairs: list[ABTestPairResponse] = []


class ABTestResultsResponse(BaseModel):
    id: UUID
    name: str
    adapter_a_name: str | None = None
    adapter_b_name: str | None = None
    total_votes: int
    a_preferred: int
    b_preferred: int
    equal: int
    a_win_rate: float
    b_win_rate: float
    statistical_significance: float | None = None  # p-value if enough samples


class ABTestListResponse(BaseModel):
    items: list[ABTestResponse]
    total: int
    limit: int
    offset: int
