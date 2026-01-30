"""Tests for generation validation logic."""

from app.models.model_registry import (
    get_model_config,
    is_adapter_compatible,
    is_duration_valid,
)


class TestGenerationDurationValidation:
    """Tests for generation duration validation against model limits."""

    def test_duration_within_limit_is_valid(self):
        """Duration within model limit should be valid."""
        # musicgen-small has max_duration_seconds = 30
        assert is_duration_valid("musicgen-small", 10) is True
        assert is_duration_valid("musicgen-small", 30) is True

    def test_duration_at_boundary_is_valid(self):
        """Duration exactly at max limit should be valid."""
        config = get_model_config("musicgen-small")
        assert config is not None
        assert is_duration_valid("musicgen-small", config.max_duration_seconds) is True

    def test_duration_exceeding_limit_is_invalid(self):
        """Duration exceeding model limit should be invalid."""
        assert is_duration_valid("musicgen-small", 31) is False
        assert is_duration_valid("musicgen-small", 60) is False
        assert is_duration_valid("musicgen-small", 120) is False

    def test_duration_validation_for_all_models(self):
        """All models should have valid duration limits."""
        from app.models.model_registry import list_models

        for model in list_models():
            # Just under max should be valid
            assert is_duration_valid(model.id, model.max_duration_seconds - 1) is True
            # At max should be valid
            assert is_duration_valid(model.id, model.max_duration_seconds) is True
            # Over max should be invalid
            assert is_duration_valid(model.id, model.max_duration_seconds + 1) is False


class TestAdapterCompatibilityValidation:
    """Tests for adapter compatibility validation."""

    def test_same_model_is_compatible(self):
        """Adapter trained on same model should be compatible."""
        # Same model specified different ways
        assert (
            is_adapter_compatible("musicgen-small", "facebook/musicgen-small") is True
        )
        assert (
            is_adapter_compatible("facebook/musicgen-small", "musicgen-small") is True
        )
        assert (
            is_adapter_compatible("facebook/musicgen-small", "facebook/musicgen-small")
            is True
        )

    def test_different_model_is_incompatible(self):
        """Adapter trained on different model should be incompatible."""
        # Small adapter with medium model
        assert is_adapter_compatible("musicgen-small", "musicgen-medium") is False
        # Medium adapter with large model
        assert is_adapter_compatible("musicgen-medium", "musicgen-large") is False
        # Large adapter with small model
        assert is_adapter_compatible("musicgen-large", "musicgen-small") is False

    def test_unknown_adapter_model_is_incompatible(self):
        """Unknown adapter model should be considered incompatible."""
        assert is_adapter_compatible("unknown-model", "musicgen-small") is False

    def test_unknown_current_model_is_incompatible(self):
        """Unknown current model should be considered incompatible."""
        assert is_adapter_compatible("musicgen-small", "unknown-model") is False


class TestModelConfigRetrieval:
    """Tests for retrieving model configuration."""

    def test_get_config_by_short_id(self):
        """Should retrieve config by short ID."""
        config = get_model_config("musicgen-small")
        assert config is not None
        assert config.display_name == "MusicGen Small"
        assert config.max_duration_seconds == 30

    def test_get_config_by_hf_id(self):
        """Should retrieve config by HuggingFace ID."""
        config = get_model_config("facebook/musicgen-medium")
        assert config is not None
        assert config.display_name == "MusicGen Medium"

    def test_get_config_returns_none_for_unknown(self):
        """Should return None for unknown model."""
        config = get_model_config("nonexistent-model")
        assert config is None

    def test_all_models_have_required_fields(self):
        """All model configs should have required fields for validation."""
        from app.models.model_registry import list_models

        for model in list_models():
            assert model.id is not None
            assert model.display_name is not None
            assert model.hf_model_id is not None
            assert model.max_duration_seconds > 0
            assert model.vram_requirement_gb > 0
            assert model.sample_rate > 0
