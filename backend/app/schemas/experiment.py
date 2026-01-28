from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# Metric data point for time-series metrics
class MetricDataPoint(BaseModel):
    step: int
    value: float
    timestamp: str


# Run metrics response
class RunMetricsResponse(BaseModel):
    run_id: UUID
    metrics: dict[str, list[MetricDataPoint]]
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


# Experiment Schemas
class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    dataset_id: UUID | None = None
    config: dict[str, Any] | None = None


class ExperimentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    dataset_id: UUID | None = None
    config: dict[str, Any] | None = None


class ExperimentRunCreate(BaseModel):
    name: str | None = None
    config: dict[str, Any] | None = None  # Override experiment config


class ExperimentRunResponse(BaseModel):
    id: UUID
    experiment_id: UUID
    adapter_id: UUID | None = None
    name: str | None = None
    status: str
    config: dict[str, Any] | None = None
    metrics: dict[str, Any] | None = None
    final_loss: float | None = None
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExperimentResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    dataset_id: UUID | None = None
    status: str
    config: dict[str, Any] | None = None
    best_run_id: UUID | None = None
    best_loss: float | None = None
    run_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExperimentDetailResponse(ExperimentResponse):
    runs: list[ExperimentRunResponse] = []


class ExperimentListResponse(BaseModel):
    items: list[ExperimentResponse]
    total: int
    limit: int
    offset: int
