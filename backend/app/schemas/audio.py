from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AudioSampleResponse(BaseModel):
    id: UUID
    prompt_id: UUID
    adapter_id: UUID | None
    duration_seconds: float
    sample_rate: int
    generation_params: dict | None
    created_at: datetime

    class Config:
        from_attributes = True


class AudioCompareRequest(BaseModel):
    audio_ids: list[UUID] = Field(..., min_length=2, max_length=10)


class AudioCompareResponse(BaseModel):
    samples: list[AudioSampleResponse]
