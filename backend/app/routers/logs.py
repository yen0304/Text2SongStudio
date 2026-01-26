import asyncio
import base64
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, get_db
from app.models import ExperimentRun, RunStatus, TrainingLog
from app.schemas import TrainingLogResponse

router = APIRouter(prefix="/runs", tags=["logs"])


@router.get("/{run_id}/logs", response_model=TrainingLogResponse)
async def get_logs(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get full training log history for a run."""
    # Verify run exists
    result = await db.execute(select(ExperimentRun).where(ExperimentRun.id == run_id))
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Get log
    result = await db.execute(select(TrainingLog).where(TrainingLog.run_id == run_id))
    log = result.scalar_one_or_none()

    if not log:
        # Return empty log if none exists
        return TrainingLogResponse(
            run_id=run_id,
            data="",
            size=0,
            updated_at=datetime.utcnow(),
        )

    return TrainingLogResponse(
        run_id=run_id,
        data=base64.b64encode(log.data).decode("utf-8"),
        size=len(log.data),
        updated_at=log.updated_at,
    )


@router.get("/{run_id}/logs/stream")
async def stream_logs(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Stream training logs via Server-Sent Events.

    Events:
    - log: {"chunk": "<base64 encoded bytes>"}
    - heartbeat: {}
    - done: {"exit_code": <int>, "final_size": <int>}
    """
    # Verify run exists
    result = await db.execute(select(ExperimentRun).where(ExperimentRun.id == run_id))
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator():
        """Generate SSE events for log streaming."""
        last_size = 0
        heartbeat_interval = 15  # seconds
        poll_interval = 0.2  # 200ms
        last_heartbeat = asyncio.get_event_loop().time()

        async with async_session_factory() as session:
            while True:
                # Check if run is still active
                result = await session.execute(
                    select(ExperimentRun).where(ExperimentRun.id == run_id)
                )
                run = result.scalar_one_or_none()

                if not run:
                    break

                # Get current log data
                result = await session.execute(
                    select(TrainingLog).where(TrainingLog.run_id == run_id)
                )
                log = result.scalar_one_or_none()

                current_size = len(log.data) if log else 0

                # If we have new data, send it
                if current_size > last_size:
                    new_data = log.data[last_size:current_size]
                    chunk_b64 = base64.b64encode(new_data).decode("utf-8")
                    yield f'event: log\ndata: {{"chunk": "{chunk_b64}"}}\n\n'
                    last_size = current_size

                # Check if run is complete
                if run.status in (
                    RunStatus.COMPLETED,
                    RunStatus.FAILED,
                    RunStatus.CANCELLED,
                ):
                    # Send any remaining data
                    if log and len(log.data) > last_size:
                        new_data = log.data[last_size:]
                        chunk_b64 = base64.b64encode(new_data).decode("utf-8")
                        yield f'event: log\ndata: {{"chunk": "{chunk_b64}"}}\n\n'

                    # Send done event
                    exit_code = 0 if run.status == RunStatus.COMPLETED else 1
                    final_size = len(log.data) if log else 0
                    yield f'event: done\ndata: {{"exit_code": {exit_code}, "final_size": {final_size}}}\n\n'
                    break

                # Send heartbeat to keep connection alive
                current_time = asyncio.get_event_loop().time()
                if current_time - last_heartbeat >= heartbeat_interval:
                    yield "event: heartbeat\ndata: {}\n\n"
                    last_heartbeat = current_time

                # Wait before polling again
                await asyncio.sleep(poll_interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering in nginx
        },
    )
