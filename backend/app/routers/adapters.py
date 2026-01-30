"""
Unified adapter router with version management and timeline support.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.adapter import Adapter, AdapterVersion
from app.models.experiment import ExperimentRun
from app.models.model_registry import get_model_config
from app.schemas.adapter import (
    AdapterCreate,
    AdapterDetailRead,
    AdapterListResponse,
    AdapterRead,
    AdapterTimelineEvent,
    AdapterTimelineResponse,
    AdapterUpdate,
    AdapterVersionRead,
)
from app.schemas.model import BaseModelConfigInfo

router = APIRouter(prefix="/adapters", tags=["adapters"])
settings = get_settings()


def _get_base_model_config_info(base_model: str) -> BaseModelConfigInfo | None:
    """Get model config info for embedding in adapter response."""
    config = get_model_config(base_model)
    if config:
        return BaseModelConfigInfo(
            id=config.id,
            display_name=config.display_name,
            max_duration_seconds=config.max_duration_seconds,
        )
    return None


@router.get("", response_model=AdapterListResponse)
async def list_adapters(
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(False),
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all adapters with optional filters."""
    query = select(Adapter)

    if active_only:
        query = query.where(Adapter.is_active.is_(True))
    if status:
        query = query.where(Adapter.status == status)

    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(Adapter.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    adapters = result.scalars().all()

    return AdapterListResponse(
        items=[
            AdapterRead(
                id=a.id,
                name=a.name,
                description=a.description,
                base_model=a.base_model,
                base_model_config=_get_base_model_config_info(a.base_model),
                status=a.status,
                current_version=a.current_version,
                config=a.config,
                is_active=a.is_active,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in adapters
        ],
        total=total,
    )


@router.get("/stats")
async def get_adapter_stats(db: AsyncSession = Depends(get_db)):
    """Get adapter statistics."""
    # Total adapters
    total_result = await db.execute(select(func.count(Adapter.id)))
    total = total_result.scalar() or 0

    # Active adapters
    active_result = await db.execute(
        select(func.count(Adapter.id)).where(Adapter.status == "active")
    )
    active = active_result.scalar() or 0

    # Total versions
    versions_result = await db.execute(select(func.count(AdapterVersion.id)))
    total_versions = versions_result.scalar() or 0

    return {
        "total": total,
        "active": active,
        "archived": total - active,
        "total_versions": total_versions,
    }


@router.get("/{adapter_id}", response_model=AdapterDetailRead)
async def get_adapter(
    adapter_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get adapter details with versions."""
    query = (
        select(Adapter)
        .options(selectinload(Adapter.versions))
        .where(Adapter.id == adapter_id)
    )
    result = await db.execute(query)
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    return AdapterDetailRead(
        id=adapter.id,
        name=adapter.name,
        description=adapter.description,
        base_model=adapter.base_model,
        base_model_config=_get_base_model_config_info(adapter.base_model),
        status=adapter.status,
        current_version=adapter.current_version,
        config=adapter.config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
        updated_at=adapter.updated_at,
        training_config=adapter.training_config,
        versions=[
            AdapterVersionRead(
                id=v.id,
                adapter_id=v.adapter_id,
                version=v.version,
                description=v.description,
                is_active=v.is_active,
                created_at=v.created_at,
            )
            for v in adapter.versions
        ],
    )


@router.get("/{adapter_id}/timeline", response_model=AdapterTimelineResponse)
async def get_adapter_timeline(
    adapter_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get timeline of adapter evolution including training runs."""
    # Get adapter
    adapter_result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = adapter_result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    events: list[AdapterTimelineEvent] = []

    # Add adapter creation event
    events.append(
        AdapterTimelineEvent(
            id=str(adapter.id),
            type="created",
            timestamp=adapter.created_at,
            title="Adapter Created",
            description=f"Adapter '{adapter.name}' was created",
            metadata={"adapter_id": str(adapter.id)},
        )
    )

    # Get all versions
    versions_result = await db.execute(
        select(AdapterVersion)
        .where(AdapterVersion.adapter_id == adapter_id)
        .order_by(AdapterVersion.created_at)
    )
    versions = versions_result.scalars().all()

    for version in versions:
        events.append(
            AdapterTimelineEvent(
                id=str(version.id),
                type="version",
                timestamp=version.created_at,
                title=f"Version {version.version}",
                description=version.description or "New version published",
                metadata={
                    "version_id": str(version.id),
                    "version": version.version,
                    "is_active": version.is_active,
                },
            )
        )

    # Get training runs
    runs_result = await db.execute(
        select(ExperimentRun)
        .where(ExperimentRun.adapter_id == adapter_id)
        .order_by(ExperimentRun.created_at)
    )
    runs = runs_result.scalars().all()

    for run in runs:
        status_text = {
            "pending": "Training scheduled",
            "running": "Training in progress",
            "completed": "Training completed",
            "failed": "Training failed",
            "cancelled": "Training cancelled",
        }.get(run.status, run.status)

        events.append(
            AdapterTimelineEvent(
                id=str(run.id),
                type="training",
                timestamp=run.started_at or run.created_at,
                title=f"Training Run: {run.name or run.id.hex[:8]}",
                description=status_text,
                metadata={
                    "run_id": str(run.id),
                    "status": run.status,
                    "final_loss": run.final_loss,
                },
            )
        )

    # Sort events by timestamp
    events.sort(key=lambda e: e.timestamp)

    return AdapterTimelineResponse(
        adapter_id=str(adapter.id),
        adapter_name=adapter.name,
        events=events,
        total_versions=len(versions),
        total_training_runs=len(runs),
    )


@router.post("", response_model=AdapterRead, status_code=201)
async def create_adapter(
    adapter_in: AdapterCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new adapter."""
    adapter = Adapter(
        name=adapter_in.name,
        description=adapter_in.description,
        base_model=adapter_in.base_model or settings.base_model_name,
        storage_path=adapter_in.storage_path,
        training_dataset_id=adapter_in.training_dataset_id,
        training_config=adapter_in.training_config or {},
        config=adapter_in.config,
    )
    db.add(adapter)
    await db.commit()
    await db.refresh(adapter)

    return AdapterRead(
        id=adapter.id,
        name=adapter.name,
        description=adapter.description,
        base_model=adapter.base_model,
        status=adapter.status,
        current_version=adapter.current_version,
        config=adapter.config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
        updated_at=adapter.updated_at,
    )


@router.patch("/{adapter_id}", response_model=AdapterRead)
async def update_adapter(
    adapter_id: UUID,
    adapter_in: AdapterUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an adapter."""
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    update_data = adapter_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(adapter, field, value)

    adapter.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(adapter)

    return AdapterRead(
        id=adapter.id,
        name=adapter.name,
        description=adapter.description,
        base_model=adapter.base_model,
        status=adapter.status,
        current_version=adapter.current_version,
        config=adapter.config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
        updated_at=adapter.updated_at,
    )


@router.delete("/{adapter_id}")
async def delete_adapter(
    adapter_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an adapter."""
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    await db.delete(adapter)
    await db.commit()
    return {"status": "deleted"}


@router.post("/{adapter_id}/versions", response_model=AdapterVersionRead)
async def create_adapter_version(
    adapter_id: UUID,
    version: str,
    description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new version for an adapter."""
    # Verify adapter exists
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    # Deactivate previous active versions
    await db.execute(
        AdapterVersion.__table__.update()
        .where(AdapterVersion.adapter_id == adapter_id)
        .values(is_active=False)
    )

    # Create new version
    adapter_version = AdapterVersion(
        adapter_id=adapter_id,
        version=version,
        description=description,
        is_active=True,
    )
    db.add(adapter_version)

    # Update adapter's current version
    adapter.current_version = version
    adapter.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(adapter_version)
    return adapter_version


@router.patch("/{adapter_id}/versions/{version_id}/activate")
async def activate_adapter_version(
    adapter_id: UUID,
    version_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Activate a specific adapter version."""
    # Verify version exists
    result = await db.execute(
        select(AdapterVersion).where(
            AdapterVersion.id == version_id, AdapterVersion.adapter_id == adapter_id
        )
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Deactivate all versions
    await db.execute(
        AdapterVersion.__table__.update()
        .where(AdapterVersion.adapter_id == adapter_id)
        .values(is_active=False)
    )

    # Activate selected version
    version.is_active = True

    # Update adapter's current version
    adapter_result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = adapter_result.scalar_one()
    adapter.current_version = version.version
    adapter.updated_at = datetime.utcnow()

    await db.commit()
    return {"status": "activated", "version": version.version}
