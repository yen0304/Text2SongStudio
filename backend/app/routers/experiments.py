import asyncio
import shutil
import zlib
from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Dataset, Experiment, ExperimentRun, ExperimentStatus, RunStatus
from app.models.training_log import TrainingLog
from app.schemas import (
    ExperimentCreate,
    ExperimentDetailResponse,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentRunCreate,
    ExperimentRunResponse,
    ExperimentUpdate,
)
from app.services.metric_parser import MetricParser
from app.services.training import TrainingService

# Backend root directory for adapter storage
BACKEND_ROOT = Path(__file__).parents[2]

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

    # Get raw data to distinguish between None (not provided) and explicit null
    raw_data = data.model_dump(exclude_unset=True)

    if "name" in raw_data:
        experiment.name = data.name
    if "description" in raw_data:
        experiment.description = data.description
    if "dataset_id" in raw_data:
        # Allow setting dataset_id to None explicitly
        experiment.dataset_id = data.dataset_id
    if "config" in raw_data:
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
        config={**(experiment.config or {}), **(data.config or {})},
        status=RunStatus.PENDING,
    )
    db.add(run)

    # Update experiment status
    experiment.status = ExperimentStatus.RUNNING
    experiment.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(run)

    # Queue training job in background using asyncio.create_task
    # This ensures it runs without blocking the API
    asyncio.create_task(TrainingService.start_training(run.id))

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


@router.get("/{experiment_id}/runs/{run_id}/metrics")
async def get_run_metrics(
    experiment_id: UUID,
    run_id: UUID,
    metric_type: str | None = Query(None, description="Filter to specific metric type"),
    min_step: int | None = Query(None, description="Minimum step (inclusive)"),
    max_step: int | None = Query(None, description="Maximum step (inclusive)"),
    db: AsyncSession = Depends(get_db),
):
    """Get time-series metrics for a specific run.

    Parses metrics fresh from the training logs for accurate visualization.
    Supports filtering by metric type and step range.
    """
    # Verify experiment exists
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Get run
    result = await db.execute(
        select(ExperimentRun).where(
            ExperimentRun.id == run_id,
            ExperimentRun.experiment_id == experiment_id,
        )
    )
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Parse metrics fresh from training logs for accuracy
    result = await db.execute(select(TrainingLog).where(TrainingLog.run_id == run_id))
    training_log = result.scalar_one_or_none()

    metrics = {}
    if training_log and training_log.data:
        try:
            # Decompress log data
            try:
                log_data = zlib.decompress(training_log.data).decode("utf-8")
            except zlib.error:
                log_data = training_log.data.decode("utf-8")

            # Parse metrics from logs
            parser = MetricParser()
            metrics = parser.parse_log_chunk(log_data)
        except Exception:
            # Fall back to cached metrics if parsing fails
            metrics = run.metrics or {}

    # Filter by metric type if specified
    if metric_type:
        metrics = {metric_type: metrics.get(metric_type, [])}

    # Filter by step range if specified
    if min_step is not None or max_step is not None:
        filtered_metrics = {}
        for key, data_points in metrics.items():
            if not isinstance(data_points, list):
                filtered_metrics[key] = data_points
                continue
            filtered = []
            for point in data_points:
                step = point.get("step", 0)
                if min_step is not None and step < min_step:
                    continue
                if max_step is not None and step > max_step:
                    continue
                filtered.append(point)
            filtered_metrics[key] = filtered
        metrics = filtered_metrics

    return {
        "run_id": str(run.id),
        "metrics": metrics,
        "metadata": {
            "last_updated": run.completed_at or run.started_at,
            "is_complete": run.status
            in [RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED],
            "status": run.status.value,
        },
    }


@router.delete("/{experiment_id}/runs/{run_id}", status_code=204)
async def delete_run(
    experiment_id: UUID,
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific run from an experiment.

    Only runs in terminal states (FAILED, COMPLETED, CANCELLED) can be deleted.
    Running or pending runs must be stopped first.
    """
    # Verify experiment exists
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Get the run
    result = await db.execute(
        select(ExperimentRun).where(
            ExperimentRun.id == run_id,
            ExperimentRun.experiment_id == experiment_id,
        )
    )
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Check if run can be deleted (must be in terminal state)
    terminal_states = {RunStatus.FAILED, RunStatus.COMPLETED, RunStatus.CANCELLED}
    if run.status not in terminal_states:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete run in '{run.status.value}' state. Only failed, completed, or cancelled runs can be deleted.",
        )

    # Delete adapter directory if exists
    adapter_dir = BACKEND_ROOT / "adapters" / str(experiment_id) / str(run_id)
    if adapter_dir.exists():
        shutil.rmtree(adapter_dir)

    # Check if this was the best run
    was_best_run = experiment.best_run_id == run_id

    # Delete the run (training_logs will cascade)
    await db.delete(run)

    # Recalculate best run if needed
    if was_best_run:
        # Find the new best run among remaining completed runs
        best_result = await db.execute(
            select(ExperimentRun)
            .where(
                ExperimentRun.experiment_id == experiment_id,
                ExperimentRun.status == RunStatus.COMPLETED,
                ExperimentRun.final_loss.isnot(None),
            )
            .order_by(ExperimentRun.final_loss.asc())
            .limit(1)
        )
        new_best_run = best_result.scalar_one_or_none()

        if new_best_run:
            experiment.best_run_id = new_best_run.id
            experiment.best_loss = new_best_run.final_loss
        else:
            experiment.best_run_id = None
            experiment.best_loss = None

        experiment.updated_at = datetime.utcnow()

    await db.commit()


@router.delete("/{experiment_id}/runs")
async def delete_runs_batch(
    experiment_id: UUID,
    run_ids: list[UUID] = Query(..., description="List of run IDs to delete"),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete multiple runs at once.
    Only runs in terminal states (failed, completed, cancelled) can be deleted.
    """
    # Verify experiment exists
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Get all runs
    result = await db.execute(
        select(ExperimentRun).where(
            ExperimentRun.id.in_(run_ids),
            ExperimentRun.experiment_id == experiment_id,
        )
    )
    runs = result.scalars().all()

    if not runs:
        raise HTTPException(status_code=404, detail="No runs found")

    # Check all runs are in terminal state
    terminal_states = {RunStatus.FAILED, RunStatus.COMPLETED, RunStatus.CANCELLED}
    non_terminal = [r for r in runs if r.status not in terminal_states]
    if non_terminal:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete {len(non_terminal)} run(s) that are not in terminal state",
        )

    deleted_count = 0
    was_best_deleted = False

    for run in runs:
        # Delete adapter directory if exists
        adapter_dir = BACKEND_ROOT / "adapters" / str(experiment_id) / str(run.id)
        if adapter_dir.exists():
            shutil.rmtree(adapter_dir)

        if experiment.best_run_id == run.id:
            was_best_deleted = True

        await db.delete(run)
        deleted_count += 1

    # Recalculate best run if needed
    if was_best_deleted:
        best_result = await db.execute(
            select(ExperimentRun)
            .where(
                ExperimentRun.experiment_id == experiment_id,
                ExperimentRun.status == RunStatus.COMPLETED,
                ExperimentRun.final_loss.isnot(None),
            )
            .order_by(ExperimentRun.final_loss.asc())
            .limit(1)
        )
        new_best_run = best_result.scalar_one_or_none()

        if new_best_run:
            experiment.best_run_id = new_best_run.id
            experiment.best_loss = new_best_run.final_loss
        else:
            experiment.best_run_id = None
            experiment.best_loss = None

        experiment.updated_at = datetime.utcnow()

    await db.commit()

    return {"deleted": deleted_count}
