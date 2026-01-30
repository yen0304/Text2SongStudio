"""Pydantic schemas for model configuration API responses."""

from pydantic import BaseModel, ConfigDict, Field


class ModelConfigResponse(BaseModel):
    """Response schema for a single model configuration."""

    # Allow fields starting with "model_" (Pydantic v2 reserves this prefix)
    model_config = ConfigDict(protected_namespaces=())

    id: str = Field(..., description="Short identifier for the model")
    display_name: str = Field(..., description="Human-readable model name")
    hf_model_id: str = Field(..., description="HuggingFace model identifier")
    max_duration_seconds: int = Field(
        ..., description="Maximum generation duration in seconds"
    )
    recommended_duration_seconds: int = Field(
        ..., description="Recommended duration for optimal quality"
    )
    vram_requirement_gb: float = Field(..., description="Minimum VRAM required in GB")
    sample_rate: int = Field(..., description="Audio sample rate in Hz")
    description: str = Field(..., description="Brief description of the model")
    is_active: bool = Field(
        default=False, description="Whether this is the currently loaded model"
    )


class ModelsListResponse(BaseModel):
    """Response schema for listing all available models."""

    models: list[ModelConfigResponse] = Field(
        ..., description="List of available model configurations"
    )
    current_model: str = Field(..., description="ID of the currently active model")


class BaseModelConfigInfo(BaseModel):
    """
    Minimal model config info to be embedded in other responses.

    Used for including model capabilities in adapter responses.
    """

    id: str = Field(..., description="Short identifier for the model")
    display_name: str = Field(..., description="Human-readable model name")
    max_duration_seconds: int = Field(
        ..., description="Maximum generation duration in seconds"
    )


class ModelSwitchRequest(BaseModel):
    """Request schema for switching to a different model."""

    # Allow fields starting with "model_" (Pydantic v2 reserves this prefix)
    model_config = ConfigDict(protected_namespaces=())

    model_id: str = Field(
        ..., description="ID of the model to switch to (e.g., 'musicgen-small')"
    )


class ModelSwitchResponse(BaseModel):
    """Response schema for model switch operation."""

    success: bool = Field(..., description="Whether the switch was successful")
    previous_model: str = Field(..., description="ID of the previous model")
    current_model: str = Field(..., description="ID of the now-active model")
    message: str = Field(..., description="Status message")


class ModelSwitchProgressEvent(BaseModel):
    """Schema for model switch progress events sent via SSE."""

    event: str = Field(
        ...,
        description="Event type: 'status', 'progress', 'done', 'error'",
    )
    message: str = Field(default="", description="Human-readable status message")
    stage: str = Field(
        default="",
        description="Current stage: 'unloading', 'downloading', 'loading'",
    )
    file_name: str | None = Field(
        default=None, description="Name of the file being downloaded"
    )
    progress: float | None = Field(default=None, description="Download progress 0-100")
    downloaded_size: str | None = Field(
        default=None, description="Human-readable downloaded size"
    )
    total_size: str | None = Field(
        default=None, description="Human-readable total size"
    )
    speed: str | None = Field(default=None, description="Download speed")
