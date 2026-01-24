from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AdapterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+$")
    description: str | None = None
    base_model: str
    storage_path: str
    training_dataset_id: UUID | None = None
    training_config: dict | None = None


class AdapterUpdate(BaseModel):
    description: str | None = None
    is_active: bool | None = None


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
