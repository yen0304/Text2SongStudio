from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TrainingLogResponse(BaseModel):
    """Response for full log history."""

    run_id: UUID
    data: str  # Base64 encoded bytes
    size: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TrainingLogChunk(BaseModel):
    """SSE event data for log chunk."""

    chunk: str  # Base64 encoded bytes


class TrainingLogDone(BaseModel):
    """SSE event data when training is complete."""

    exit_code: int | None = None
    final_size: int
