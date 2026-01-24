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
    duration: int | None = Field(None, ge=1, le=30)


class GenerationJobResponse(BaseModel):
    id: UUID
    status: str
    progress: float | None = None
    audio_ids: list[UUID] | None = None
    error: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
