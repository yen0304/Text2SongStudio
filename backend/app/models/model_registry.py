"""
Model Registry - Centralized configuration for supported models.

This module defines the capabilities and constraints of each supported
model to ensure consistent behavior across the application.
"""

from dataclasses import dataclass

from app.config import get_settings


@dataclass(frozen=True)
class ModelConfig:
    """Configuration for a supported model."""

    id: str
    display_name: str
    hf_model_id: str
    max_duration_seconds: int
    recommended_duration_seconds: int
    tokens_per_second: int
    vram_requirement_gb: float
    sample_rate: int
    description: str


# Model configurations registry
MODEL_CONFIGS: dict[str, ModelConfig] = {
    "facebook/musicgen-small": ModelConfig(
        id="musicgen-small",
        display_name="MusicGen Small",
        hf_model_id="facebook/musicgen-small",
        max_duration_seconds=30,
        recommended_duration_seconds=10,
        tokens_per_second=50,
        vram_requirement_gb=4.0,
        sample_rate=32000,
        description="Fast generation, good for prototyping",
    ),
    "facebook/musicgen-medium": ModelConfig(
        id="musicgen-medium",
        display_name="MusicGen Medium",
        hf_model_id="facebook/musicgen-medium",
        max_duration_seconds=30,
        recommended_duration_seconds=15,
        tokens_per_second=50,
        vram_requirement_gb=8.0,
        sample_rate=32000,
        description="Balanced quality and speed",
    ),
    "facebook/musicgen-large": ModelConfig(
        id="musicgen-large",
        display_name="MusicGen Large",
        hf_model_id="facebook/musicgen-large",
        max_duration_seconds=30,
        recommended_duration_seconds=10,
        tokens_per_second=50,
        vram_requirement_gb=16.0,
        sample_rate=32000,
        description="Highest quality, requires more VRAM",
    ),
}


def get_model_config(model_name: str) -> ModelConfig | None:
    """
    Get configuration for a model by its HuggingFace ID or short ID.

    Args:
        model_name: Either the full HF model ID (e.g., "facebook/musicgen-small")
                   or the short ID (e.g., "musicgen-small")

    Returns:
        ModelConfig if found, None otherwise
    """
    # Direct lookup by HF model ID
    if model_name in MODEL_CONFIGS:
        return MODEL_CONFIGS[model_name]

    # Lookup by short ID
    for config in MODEL_CONFIGS.values():
        if config.id == model_name:
            return config

    return None


def get_max_duration(model_name: str) -> int:
    """
    Get the maximum duration in seconds for a model.

    Args:
        model_name: The model identifier

    Returns:
        Maximum duration in seconds, or 30 as default
    """
    config = get_model_config(model_name)
    return config.max_duration_seconds if config else 30


def get_current_model_config() -> ModelConfig:
    """
    Get the configuration for the currently active model.

    Returns:
        ModelConfig for the active model, or musicgen-small as fallback
    """
    settings = get_settings()
    config = get_model_config(settings.base_model_name)
    if config:
        return config

    # Fallback to musicgen-small
    return MODEL_CONFIGS["facebook/musicgen-small"]


def list_models() -> list[ModelConfig]:
    """
    List all available model configurations.

    Returns:
        List of all ModelConfig objects
    """
    return list(MODEL_CONFIGS.values())


def is_duration_valid(model_name: str, duration_seconds: int) -> bool:
    """
    Check if a duration is valid for a given model.

    Args:
        model_name: The model identifier
        duration_seconds: Requested duration in seconds

    Returns:
        True if duration is within model limits
    """
    max_duration = get_max_duration(model_name)
    return 0 < duration_seconds <= max_duration


def is_adapter_compatible(adapter_base_model: str, current_model: str) -> bool:
    """
    Check if an adapter is compatible with the current model.

    LoRA adapters are bound to specific base models and cannot be used
    with different models.

    Args:
        adapter_base_model: The base model the adapter was trained on
        current_model: The currently loaded model

    Returns:
        True if adapter is compatible with current model
    """
    adapter_config = get_model_config(adapter_base_model)
    current_config = get_model_config(current_model)

    if adapter_config is None or current_config is None:
        return False

    # Adapters must match the exact model
    return adapter_config.hf_model_id == current_config.hf_model_id
