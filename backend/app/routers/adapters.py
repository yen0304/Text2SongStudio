from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models import Adapter
from app.schemas import AdapterCreate, AdapterUpdate, AdapterResponse, AdapterListResponse
from app.config import get_settings

router = APIRouter(prefix="/adapters", tags=["adapters"])
settings = get_settings()


@router.post("", response_model=AdapterResponse, status_code=201)
async def register_adapter(
    data: AdapterCreate,
    db: AsyncSession = Depends(get_db),
):
    # Check for duplicate name+version
    result = await db.execute(
        select(Adapter).where(
            and_(Adapter.name == data.name, Adapter.version == data.version)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Adapter '{data.name}' version '{data.version}' already exists",
        )

    # Validate base model compatibility
    if data.base_model != settings.base_model_name:
        raise HTTPException(
            status_code=400,
            detail=f"Adapter base model '{data.base_model}' is not compatible with current base model '{settings.base_model_name}'",
        )

    adapter = Adapter(
        name=data.name,
        version=data.version,
        description=data.description,
        base_model=data.base_model,
        storage_path=data.storage_path,
        training_dataset_id=data.training_dataset_id,
        training_config=data.training_config or {},
    )
    db.add(adapter)
    await db.commit()
    await db.refresh(adapter)

    return AdapterResponse(
        id=adapter.id,
        name=adapter.name,
        version=adapter.version,
        description=adapter.description,
        base_model=adapter.base_model,
        storage_path=adapter.storage_path,
        training_dataset_id=adapter.training_dataset_id,
        training_config=adapter.training_config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
    )


@router.get("", response_model=AdapterListResponse)
async def list_adapters(
    active_only: bool = Query(False),
    base_model: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Adapter)

    if active_only:
        query = query.where(Adapter.is_active == True)
    if base_model:
        query = query.where(Adapter.base_model == base_model)

    query = query.order_by(Adapter.name, Adapter.version.desc())

    result = await db.execute(query)
    adapters = result.scalars().all()

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    return AdapterListResponse(
        items=[
            AdapterResponse(
                id=a.id,
                name=a.name,
                version=a.version,
                description=a.description,
                base_model=a.base_model,
                storage_path=a.storage_path,
                training_dataset_id=a.training_dataset_id,
                training_config=a.training_config,
                is_active=a.is_active,
                created_at=a.created_at,
            )
            for a in adapters
        ],
        total=total,
    )


@router.get("/{adapter_id}", response_model=AdapterResponse)
async def get_adapter(
    adapter_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    return AdapterResponse(
        id=adapter.id,
        name=adapter.name,
        version=adapter.version,
        description=adapter.description,
        base_model=adapter.base_model,
        storage_path=adapter.storage_path,
        training_dataset_id=adapter.training_dataset_id,
        training_config=adapter.training_config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
    )


@router.patch("/{adapter_id}", response_model=AdapterResponse)
async def update_adapter(
    adapter_id: UUID,
    data: AdapterUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()

    if not adapter:
        raise HTTPException(status_code=404, detail="Adapter not found")

    if data.description is not None:
        adapter.description = data.description
    if data.is_active is not None:
        adapter.is_active = data.is_active

    await db.commit()
    await db.refresh(adapter)

    return AdapterResponse(
        id=adapter.id,
        name=adapter.name,
        version=adapter.version,
        description=adapter.description,
        base_model=adapter.base_model,
        storage_path=adapter.storage_path,
        training_dataset_id=adapter.training_dataset_id,
        training_config=adapter.training_config,
        is_active=adapter.is_active,
        created_at=adapter.created_at,
    )
