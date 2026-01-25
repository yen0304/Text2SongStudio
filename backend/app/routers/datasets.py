from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Adapter, Dataset, Experiment, ExperimentStatus
from app.schemas import (
    DatasetCreate,
    DatasetExportRequest,
    DatasetExportResponse,
    DatasetListResponse,
    DatasetPreviewRequest,
    DatasetPreviewResponse,
    DatasetResponse,
    DatasetStatsResponse,
)
from app.services.dataset import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=DatasetListResponse)
async def list_datasets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    include_deleted: bool = Query(False, description="Include soft-deleted datasets"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Dataset)

    # Exclude soft-deleted by default
    if not include_deleted:
        query = query.where(Dataset.deleted_at.is_(None))

    query = query.order_by(Dataset.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    datasets = result.scalars().all()

    return DatasetListResponse(
        items=[
            DatasetResponse(
                id=d.id,
                name=d.name,
                description=d.description,
                type=d.type,
                filter_query=d.filter_query,
                sample_count=d.sample_count,
                export_path=d.export_path,
                created_at=d.created_at,
                deleted_at=d.deleted_at,
            )
            for d in datasets
        ],
        total=total,
    )


@router.post("/preview", response_model=DatasetPreviewResponse)
async def preview_dataset(
    data: DatasetPreviewRequest,
    db: AsyncSession = Depends(get_db),
):
    dataset_service = DatasetService(db)
    count = await dataset_service.count_samples(data.type, data.filter_query)

    return DatasetPreviewResponse(count=count)


@router.post("", response_model=DatasetResponse, status_code=201)
async def create_dataset(
    data: DatasetCreate,
    db: AsyncSession = Depends(get_db),
):
    dataset_service = DatasetService(db)

    # Build dataset from feedback
    sample_count = await dataset_service.count_samples(data.type, data.filter_query)

    if sample_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No samples match the filter criteria",
        )

    dataset = Dataset(
        name=data.name,
        description=data.description,
        type=data.type,
        filter_query=data.filter_query.model_dump() if data.filter_query else {},
        sample_count=sample_count,
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)

    return DatasetResponse(
        id=dataset.id,
        name=dataset.name,
        description=dataset.description,
        type=dataset.type,
        filter_query=dataset.filter_query,
        sample_count=dataset.sample_count,
        export_path=dataset.export_path,
        created_at=dataset.created_at,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.deleted_at.is_(None),
        )
    )
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return DatasetResponse(
        id=dataset.id,
        name=dataset.name,
        description=dataset.description,
        type=dataset.type,
        filter_query=dataset.filter_query,
        sample_count=dataset.sample_count,
        export_path=dataset.export_path,
        created_at=dataset.created_at,
    )


@router.post("/{dataset_id}/export", response_model=DatasetExportResponse)
async def export_dataset(
    dataset_id: UUID,
    data: DatasetExportRequest,
    _background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset_service = DatasetService(db)

    # Export dataset
    export_path = await dataset_service.export_dataset(
        dataset,
        format=data.format,
        output_path=data.output_path,
    )

    # Update dataset with export path
    dataset.export_path = export_path
    await db.commit()

    return DatasetExportResponse(
        dataset_id=dataset.id,
        export_path=export_path,
        sample_count=dataset.sample_count,
        format=data.format,
    )


@router.get("/{dataset_id}/stats", response_model=DatasetStatsResponse)
async def get_dataset_stats(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset_service = DatasetService(db)
    stats = await dataset_service.get_stats(dataset)

    return DatasetStatsResponse(
        dataset_id=dataset.id,
        sample_count=dataset.sample_count,
        rating_distribution=stats["rating_distribution"],
        unique_prompts=stats["unique_prompts"],
        unique_adapters=stats["unique_adapters"],
        tag_frequency=stats["tag_frequency"],
        inter_rater_agreement=stats.get("inter_rater_agreement"),
        preference_consistency=stats.get("preference_consistency"),
    )


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a dataset.

    Only succeeds if no active Adapters or Experiments reference this dataset.
    Active means: Adapter.deleted_at IS NULL or Experiment.status != ARCHIVED
    """
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.deleted_at.is_(None),
        )
    )
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Check for active Adapters referencing this dataset
    active_adapters_query = select(Adapter).where(
        Adapter.training_dataset_id == dataset_id,
        Adapter.deleted_at.is_(None),
    )
    active_adapters_result = await db.execute(active_adapters_query)
    active_adapters = active_adapters_result.scalars().all()

    if active_adapters:
        adapter_names = [a.name for a in active_adapters[:5]]
        detail = f"Cannot delete dataset: referenced by {len(active_adapters)} active adapter(s): {', '.join(adapter_names)}"
        if len(active_adapters) > 5:
            detail += f" and {len(active_adapters) - 5} more"
        raise HTTPException(status_code=400, detail=detail)

    # Check for active Experiments referencing this dataset
    active_experiments_query = select(Experiment).where(
        Experiment.dataset_id == dataset_id,
        Experiment.status != ExperimentStatus.ARCHIVED,
    )
    active_experiments_result = await db.execute(active_experiments_query)
    active_experiments = active_experiments_result.scalars().all()

    if active_experiments:
        experiment_names = [e.name for e in active_experiments[:5]]
        detail = f"Cannot delete dataset: referenced by {len(active_experiments)} active experiment(s): {', '.join(experiment_names)}"
        if len(active_experiments) > 5:
            detail += f" and {len(active_experiments) - 5} more"
        raise HTTPException(status_code=400, detail=detail)

    # Soft delete
    dataset.deleted_at = datetime.utcnow()
    await db.commit()
