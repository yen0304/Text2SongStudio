"""API router for model configuration endpoints."""

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.model_registry import (
    get_current_model_config,
    get_model_config,
    list_models,
)
from app.schemas.model import (
    ModelConfigResponse,
    ModelsListResponse,
    ModelSwitchRequest,
    ModelSwitchResponse,
)
from app.services.generation import GenerationService

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelsListResponse)
async def get_available_models() -> ModelsListResponse:
    """
    Get all available model configurations with their capabilities.

    Returns a list of supported models including their max duration,
    VRAM requirements, and other capabilities. Also indicates which
    model is currently active.
    """
    current_model_name = GenerationService.get_current_model_name()
    current_config = get_model_config(current_model_name)
    all_models = list_models()

    model_responses = [
        ModelConfigResponse(
            id=model.id,
            display_name=model.display_name,
            hf_model_id=model.hf_model_id,
            max_duration_seconds=model.max_duration_seconds,
            recommended_duration_seconds=model.recommended_duration_seconds,
            vram_requirement_gb=model.vram_requirement_gb,
            sample_rate=model.sample_rate,
            description=model.description,
            is_active=(model.hf_model_id == current_model_name),
        )
        for model in all_models
    ]

    return ModelsListResponse(
        models=model_responses,
        current_model=current_config.id if current_config else "musicgen-small",
    )


@router.get("/current", response_model=ModelConfigResponse)
async def get_current_model() -> ModelConfigResponse:
    """
    Get the currently active model configuration.

    Returns the configuration for the model that is currently loaded
    and being used for audio generation.
    """
    current_model_name = GenerationService.get_current_model_name()
    config = get_model_config(current_model_name)

    if not config:
        # Fallback to default
        config = get_current_model_config()

    return ModelConfigResponse(
        id=config.id,
        display_name=config.display_name,
        hf_model_id=config.hf_model_id,
        max_duration_seconds=config.max_duration_seconds,
        recommended_duration_seconds=config.recommended_duration_seconds,
        vram_requirement_gb=config.vram_requirement_gb,
        sample_rate=config.sample_rate,
        description=config.description,
        is_active=True,
    )


@router.post("/switch", response_model=ModelSwitchResponse)
async def switch_model(request: ModelSwitchRequest) -> ModelSwitchResponse:
    """
    Switch to a different model.

    This will unload the current model and load the requested one.
    During the switch, generation requests will be rejected.
    """
    # Validate that the requested model exists
    target_config = get_model_config(request.model_id)
    if not target_config:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model: {request.model_id}. "
            f"Available models: musicgen-small, musicgen-medium, musicgen-large",
        )

    # Check if a switch is already in progress
    if GenerationService.is_switching():
        raise HTTPException(
            status_code=409,
            detail="A model switch is already in progress. Please wait.",
        )

    try:
        previous_model, new_model = await GenerationService.switch_model(
            target_config.hf_model_id
        )

        # Get the config for the new model to return the ID
        new_config = get_model_config(new_model)
        prev_config = get_model_config(previous_model)

        return ModelSwitchResponse(
            success=True,
            previous_model=prev_config.id if prev_config else previous_model,
            current_model=new_config.id if new_config else new_model,
            message=f"Successfully switched from {prev_config.display_name if prev_config else previous_model} "
            f"to {new_config.display_name if new_config else new_model}",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to switch model: {str(e)}",
        )


@router.post("/switch/stream")
async def switch_model_stream(request: ModelSwitchRequest):
    """
    Switch to a different model with progress streaming via SSE.

    This endpoint streams progress events during the model switch process,
    including download progress, loading status, and completion/error events.

    Events:
    - status: {"event": "status", "stage": "...", "message": "..."}
    - progress: {"event": "progress", "stage": "downloading", "file_name": "...", "progress": 0-100, ...}
    - heartbeat: {"event": "heartbeat", ...}
    - done: {"event": "done", "previous_model": "...", "current_model": "..."}
    - error: {"event": "error", "message": "..."}
    """
    import logging  # noqa: PLC0415

    logger = logging.getLogger(__name__)

    # Validate that the requested model exists
    target_config = get_model_config(request.model_id)
    if not target_config:

        async def error_generator():
            yield f"event: error\ndata: {json.dumps({'event': 'error', 'message': f'Unknown model: {request.model_id}'})}\n\n"

        return StreamingResponse(
            error_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    async def event_generator():
        """Generate SSE events for model switch progress."""
        event_count = 0
        try:
            async for event in GenerationService.switch_model_with_progress(
                target_config.hf_model_id
            ):
                event_type = event.get("event", "status")
                event_count += 1
                logger.info(
                    f"SSE event #{event_count}: {event_type} - {event.get('message', '')[:50]}"
                )
                yield f"event: {event_type}\ndata: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"SSE generator error after {event_count} events: {e}")
            raise
        finally:
            logger.info(f"SSE generator finished after {event_count} events")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
