from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Dataset, Experiment, ExperimentRun, ExperimentStatus, RunStatus
from app.schemas import (
    ExperimentCreate,
    ExperimentDetailResponse,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentRunCreate,
    ExperimentRunResponse,
    ExperimentUpdate,
)

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=ExperimentListResponse)
async def list_experiments(
    status: str | None = Query(None, description="Filter by status"),
    include_archived: bool = Query(False, description="Include archived experiments"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all experiments with optional filtering."""
    query = select(Experiment)

    if status:
        query = query.where(Experiment.status == status)
    elif not include_archived:
        # Exclude archived by default unless specific status is requested
        query = query.where(Experiment.status != ExperimentStatus.ARCHIVED)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Get items
    query = query.order_by(Experiment.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    experiments = result.scalars().all()

    # Add run counts
    items = []
    for exp in experiments:
        run_count_query = select(func.count()).where(
            ExperimentRun.experiment_id == exp.id
        )
        run_count = await db.scalar(run_count_query) or 0

        item = ExperimentResponse(
            id=exp.id,
            name=exp.name,
            description=exp.description,
            dataset_id=exp.dataset_id,
            status=exp.status.value,
            config=exp.config,
            best_run_id=exp.best_run_id,
            best_loss=exp.best_loss,
            run_count=run_count,
            created_at=exp.created_at,
            updated_at=exp.updated_at,
        )
        items.append(item)

    return ExperimentListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ExperimentResponse, status_code=201)
async def create_experiment(
    data: ExperimentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new experiment."""
    # Verify dataset exists if provided
    if data.dataset_id:
        result = await db.execute(select(Dataset).where(Dataset.id == data.dataset_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Dataset not found")

    experiment = Experiment(
        name=data.name,
        description=data.description,
        dataset_id=data.dataset_id,
        config=data.config or {},
    )
    db.add(experiment)
    await db.commit()
    await db.refresh(experiment)

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        dataset_id=experiment.dataset_id,
        status=experiment.status.value,
        config=experiment.config,
        best_run_id=experiment.best_run_id,
        best_loss=experiment.best_loss,
        run_count=0,
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
    )


@router.get("/{experiment_id}", response_model=ExperimentDetailResponse)
async def get_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get experiment details including runs."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Get runs
    runs_result = await db.execute(
        select(ExperimentRun)
        .where(ExperimentRun.experiment_id == experiment_id)
        .order_by(ExperimentRun.created_at.desc())
    )
    runs = runs_result.scalars().all()

    run_responses = [
        ExperimentRunResponse(
            id=run.id,
            experiment_id=run.experiment_id,
            adapter_id=run.adapter_id,
            name=run.name,
            status=run.status.value,
            config=run.config,
            metrics=run.metrics,
            final_loss=run.final_loss,
            error=run.error,
            started_at=run.started_at,
            completed_at=run.completed_at,
            created_at=run.created_at,
        )
        for run in runs
    ]

    return ExperimentDetailResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        dataset_id=experiment.dataset_id,
        status=experiment.status.value,
        config=experiment.config,
        best_run_id=experiment.best_run_id,
        best_loss=experiment.best_loss,
        run_count=len(runs),
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
        runs=run_responses,
    )


@router.put("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: UUID,
    data: ExperimentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update experiment details."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if data.name is not None:
        experiment.name = data.name
    if data.description is not None:
        experiment.description = data.description
    if data.dataset_id is not None:
        experiment.dataset_id = data.dataset_id
    if data.config is not None:
        experiment.config = data.config

    experiment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(experiment)

    run_count_query = select(func.count()).where(
        ExperimentRun.experiment_id == experiment.id
    )
    run_count = await db.scalar(run_count_query) or 0

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        dataset_id=experiment.dataset_id,
        status=experiment.status.value,
        config=experiment.config,
        best_run_id=experiment.best_run_id,
        best_loss=experiment.best_loss,
        run_count=run_count,
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
    )


@router.post("/{experiment_id}/archive", response_model=ExperimentResponse)
async def archive_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Archive an experiment (hides from default list view)."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if experiment.status == ExperimentStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Experiment is already archived")

    experiment.status = ExperimentStatus.ARCHIVED
    experiment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(experiment)

    run_count_query = select(func.count()).where(
        ExperimentRun.experiment_id == experiment.id
    )
    run_count = await db.scalar(run_count_query) or 0

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        dataset_id=experiment.dataset_id,
        status=experiment.status.value,
        config=experiment.config,
        best_run_id=experiment.best_run_id,
        best_loss=experiment.best_loss,
        run_count=run_count,
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
    )


@router.post("/{experiment_id}/unarchive", response_model=ExperimentResponse)
async def unarchive_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Unarchive an experiment (restores to draft status)."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if experiment.status != ExperimentStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Experiment is not archived")

    experiment.status = ExperimentStatus.DRAFT
    experiment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(experiment)

    run_count_query = select(func.count()).where(
        ExperimentRun.experiment_id == experiment.id
    )
    run_count = await db.scalar(run_count_query) or 0

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        dataset_id=experiment.dataset_id,
        status=experiment.status.value,
        config=experiment.config,
        best_run_id=experiment.best_run_id,
        best_loss=experiment.best_loss,
        run_count=run_count,
        created_at=experiment.created_at,
        updated_at=experiment.updated_at,
    )


@router.delete("/{experiment_id}", status_code=204)
async def delete_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an experiment (archives it instead of hard delete)."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Archive instead of hard delete to preserve run history
    experiment.status = ExperimentStatus.ARCHIVED
    experiment.updated_at = datetime.utcnow()
    await db.commit()


@router.get("/{experiment_id}/runs", response_model=list[ExperimentRunResponse])
async def list_runs(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all runs for an experiment."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs_result = await db.execute(
        select(ExperimentRun)
        .where(ExperimentRun.experiment_id == experiment_id)
        .order_by(ExperimentRun.created_at.desc())
    )
    runs = runs_result.scalars().all()

    return [
        ExperimentRunResponse(
            id=run.id,
            experiment_id=run.experiment_id,
            adapter_id=run.adapter_id,
            name=run.name,
            status=run.status.value,
            config=run.config,
            metrics=run.metrics,
            final_loss=run.final_loss,
            error=run.error,
            started_at=run.started_at,
            completed_at=run.completed_at,
            created_at=run.created_at,
        )
        for run in runs
    ]


@router.post(
    "/{experiment_id}/runs", response_model=ExperimentRunResponse, status_code=201
)
async def create_run(
    experiment_id: UUID,
    data: ExperimentRunCreate,
    db: AsyncSession = Depends(get_db),
):
    """Start a new training run in an experiment."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Count existing runs to generate name
    run_count_query = select(func.count()).where(
        ExperimentRun.experiment_id == experiment_id
    )
    run_count = await db.scalar(run_count_query) or 0

    run = ExperimentRun(
        experiment_id=experiment_id,
        name=data.name or f"run-{run_count + 1}",
        config=data.config or experiment.config,
        status=RunStatus.PENDING,
    )
    db.add(run)

    # Update experiment status
    experiment.status = ExperimentStatus.RUNNING
    experiment.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(run)

    # TODO: Queue training job in background

    return ExperimentRunResponse(
        id=run.id,
        experiment_id=run.experiment_id,
        adapter_id=run.adapter_id,
        name=run.name,
        status=run.status.value,
        config=run.config,
        metrics=run.metrics,
        final_loss=run.final_loss,
        error=run.error,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
    )


@router.get("/{experiment_id}/metrics")
async def get_experiment_metrics(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated metrics for all runs in an experiment."""
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs_result = await db.execute(
        select(ExperimentRun)
        .where(ExperimentRun.experiment_id == experiment_id)
        .where(ExperimentRun.status == RunStatus.COMPLETED)
    )
    runs = runs_result.scalars().all()

    return {
        "experiment_id": experiment_id,
        "run_count": len(runs),
        "runs": [
            {
                "id": run.id,
                "name": run.name,
                "final_loss": run.final_loss,
                "metrics": run.metrics,
                "adapter_id": run.adapter_id,
            }
            for run in runs
        ],
        "best_loss": experiment.best_loss,
        "best_run_id": experiment.best_run_id,
    }
