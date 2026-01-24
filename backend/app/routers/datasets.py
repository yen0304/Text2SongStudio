from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Dataset
from app.schemas import (
    DatasetCreate,
    DatasetResponse,
    DatasetExportRequest,
    DatasetExportResponse,
    DatasetStatsResponse,
)
from app.services.dataset import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])


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
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
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
    background_tasks: BackgroundTasks,
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
