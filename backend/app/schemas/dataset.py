from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.dataset import DatasetType


class DatasetFilterQuery(BaseModel):
    min_rating: float | None = Field(None, ge=1, le=5)
    max_rating: float | None = Field(None, ge=1, le=5)
    required_tags: list[str] | None = None
    excluded_tags: list[str] | None = None
    adapter_id: UUID | None = None
    user_id: UUID | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    type: DatasetType
    filter_query: DatasetFilterQuery | None = None


class DatasetResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    type: DatasetType
    filter_query: dict | None
    sample_count: int
    export_path: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    items: list[DatasetResponse]
    total: int


class DatasetPreviewRequest(BaseModel):
    type: DatasetType
    filter_query: DatasetFilterQuery | None = None


class DatasetPreviewResponse(BaseModel):
    count: int


class DatasetExportRequest(BaseModel):
    format: str = Field("huggingface", pattern="^(huggingface|json|csv)$")
    output_path: str | None = None


class DatasetExportResponse(BaseModel):
    dataset_id: UUID
    export_path: str
    sample_count: int
    format: str


class DatasetStatsResponse(BaseModel):
    dataset_id: UUID
    sample_count: int
    rating_distribution: dict
    unique_prompts: int
    unique_adapters: int
    tag_frequency: dict
    inter_rater_agreement: float | None = None
    preference_consistency: float | None = None
