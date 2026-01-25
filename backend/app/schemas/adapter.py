from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AdapterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    version: str | None = Field(None, pattern=r"^\d+\.\d+\.\d+$")
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


class AdapterResponse(BaseModel):
    id: UUID
    name: str
    version: str
    description: str | None
    base_model: str
    storage_path: str
    training_dataset_id: UUID | None
    training_config: dict | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdapterListResponse(BaseModel):
    items: list[AdapterResponse]
    total: int


# Enhanced schemas for v2 adapters router
class AdapterRead(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    base_model: str
    status: str
    current_version: str | None = None
    config: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


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
