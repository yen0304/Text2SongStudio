from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AdapterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    base_model: str = "musicgen-small"
    storage_path: str | None = None
    training_dataset_id: UUID | None = None
    training_config: dict | None = None
    config: dict | None = None


class AdapterUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    status: str | None = None
    config: dict | None = None


class AdapterRead(BaseModel):
    """Unified adapter response schema."""

    id: UUID
    name: str
    description: str | None = None
    base_model: str
    status: str = "active"
    current_version: str | None = None
    config: dict[str, Any] | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# Alias for backward compatibility
AdapterResponse = AdapterRead


class AdapterListResponse(BaseModel):
    items: list[AdapterRead]
    total: int


class AdapterVersionRead(BaseModel):
    id: UUID
    adapter_id: UUID
    version: str
    description: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdapterDetailRead(AdapterRead):
    versions: list[AdapterVersionRead] = []
    training_config: dict[str, Any] | None = None


class AdapterTimelineEvent(BaseModel):
    id: str
    type: str  # "created", "version", "training"
    timestamp: datetime
    title: str
    description: str | None = None
    metadata: dict[str, Any] | None = None


class AdapterTimelineResponse(BaseModel):
    adapter_id: str
    adapter_name: str
    events: list[AdapterTimelineEvent]
    total_versions: int
    total_training_runs: int
