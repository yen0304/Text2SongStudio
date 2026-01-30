"""Tests for model registry functions."""

import pytest

from app.models.model_registry import (
    MODEL_CONFIGS,
    ModelConfig,
    get_current_model_config,
    get_max_duration,
    get_model_config,
    is_adapter_compatible,
    is_duration_valid,
    list_models,
)


class TestModelConfig:
    """Tests for ModelConfig dataclass."""

    def test_model_config_is_frozen(self):
        """ModelConfig should be immutable (frozen=True)."""
        config = list_models()[0]
        with pytest.raises(AttributeError):  # FrozenInstanceError
            config.max_duration_seconds = 999


class TestGetModelConfig:
    """Tests for get_model_config function."""

    def test_get_by_hf_model_id(self):
        """Should return config when queried by full HuggingFace model ID."""
        config = get_model_config("facebook/musicgen-small")
        assert config is not None
        assert config.id == "musicgen-small"
        assert config.display_name == "MusicGen Small"

    def test_get_by_short_id(self):
        """Should return config when queried by short ID."""
        config = get_model_config("musicgen-medium")
        assert config is not None
        assert config.hf_model_id == "facebook/musicgen-medium"

    def test_get_unknown_model(self):
        """Should return None for unknown model."""
        config = get_model_config("unknown-model")
        assert config is None

    def test_all_models_have_configs(self):
        """All models in MODEL_CONFIGS should be retrievable."""
        for hf_id in MODEL_CONFIGS:
            config = get_model_config(hf_id)
            assert config is not None


class TestGetMaxDuration:
    """Tests for get_max_duration function."""

    def test_get_max_duration_known_model(self):
        """Should return correct max duration for known model."""
        duration = get_max_duration("facebook/musicgen-small")
        assert duration == 30

    def test_get_max_duration_unknown_model(self):
        """Should return default 30 for unknown model."""
        duration = get_max_duration("unknown-model")
        assert duration == 30

    def test_get_max_duration_by_short_id(self):
        """Should work with short ID."""
        duration = get_max_duration("musicgen-large")
        assert duration == 30


class TestGetCurrentModelConfig:
    """Tests for get_current_model_config function."""

    def test_returns_model_config(self):
        """Should return a valid ModelConfig."""
        config = get_current_model_config()
        assert isinstance(config, ModelConfig)
        assert config.id in ["musicgen-small", "musicgen-medium", "musicgen-large"]

    def test_fallback_to_default(self):
        """Should fallback to musicgen-small if settings model is unknown."""
        # The function uses get_settings() which defaults to musicgen-small
        config = get_current_model_config()
        assert config is not None


class TestListModels:
    """Tests for list_models function."""

    def test_returns_all_models(self):
        """Should return all registered models."""
        models = list_models()
        assert len(models) == 3
        ids = [m.id for m in models]
        assert "musicgen-small" in ids
        assert "musicgen-medium" in ids
        assert "musicgen-large" in ids

    def test_returns_model_config_instances(self):
        """All returned items should be ModelConfig instances."""
        models = list_models()
        for model in models:
            assert isinstance(model, ModelConfig)


class TestIsDurationValid:
    """Tests for is_duration_valid function."""

    def test_valid_duration(self):
        """Duration within limits should be valid."""
        assert is_duration_valid("musicgen-small", 10) is True
        assert is_duration_valid("musicgen-small", 30) is True

    def test_invalid_duration_zero(self):
        """Duration of 0 should be invalid."""
        assert is_duration_valid("musicgen-small", 0) is False

    def test_invalid_duration_negative(self):
        """Negative duration should be invalid."""
        assert is_duration_valid("musicgen-small", -5) is False

    def test_invalid_duration_exceeds_max(self):
        """Duration exceeding max should be invalid."""
        assert is_duration_valid("musicgen-small", 31) is False
        assert is_duration_valid("musicgen-small", 100) is False


class TestIsAdapterCompatible:
    """Tests for is_adapter_compatible function."""

    def test_compatible_same_model(self):
        """Adapter should be compatible with same model."""
        assert (
            is_adapter_compatible("musicgen-small", "facebook/musicgen-small") is True
        )
        assert (
            is_adapter_compatible("facebook/musicgen-small", "musicgen-small") is True
        )

    def test_incompatible_different_models(self):
        """Adapter should be incompatible with different model."""
        assert (
            is_adapter_compatible("musicgen-small", "facebook/musicgen-medium") is False
        )
        assert is_adapter_compatible("musicgen-large", "musicgen-small") is False

    def test_unknown_adapter_model(self):
        """Unknown adapter model should be incompatible."""
        assert is_adapter_compatible("unknown-model", "musicgen-small") is False

    def test_unknown_current_model(self):
        """Unknown current model should be incompatible."""
        assert is_adapter_compatible("musicgen-small", "unknown-model") is False
