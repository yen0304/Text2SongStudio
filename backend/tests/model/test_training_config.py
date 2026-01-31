"""Tests for model.training.config module."""

import pytest


class TestTrainingConfig:
    """Tests for TrainingConfig dataclass."""

    def test_default_values(self):
        """Test that default values are set correctly."""
        from model.training.config import TrainingConfig

        config = TrainingConfig()

        # Dataset defaults
        assert config.dataset_path == ""
        assert config.dataset_type == "supervised"

        # Model defaults
        assert config.base_model == "facebook/musicgen-small"
        assert config.model_cache_dir == "./model_cache"

        # LoRA defaults
        assert config.lora_r == 16
        assert config.lora_alpha == 32
        assert config.lora_dropout == 0.05
        assert config.lora_target_modules == [
            "q_proj",
            "v_proj",
            "k_proj",
            "out_proj",
            "fc1",
            "fc2",
        ]

        # Training defaults
        assert config.num_epochs == 3
        assert config.batch_size == 2
        assert config.gradient_accumulation_steps == 4
        assert config.learning_rate == 1e-4
        assert config.weight_decay == 0.01
        assert config.warmup_steps == 100
        assert config.max_grad_norm == 1.0

        # DPO defaults
        assert config.dpo_beta == 0.1

        # Checkpointing defaults
        assert config.save_steps == 500
        assert config.save_total_limit == 3
        assert config.eval_steps == 100

        # Early stopping defaults
        assert config.early_stopping_enabled is True
        assert config.early_stopping_patience == 3
        assert config.early_stopping_threshold == 0.01

        # Hardware defaults
        assert config.fp16 is True
        assert config.device == "cuda"

    def test_early_stopping_enabled_default(self):
        """Test that early_stopping_enabled defaults to True."""
        from model.training.config import TrainingConfig

        config = TrainingConfig()
        assert config.early_stopping_enabled is True

    def test_early_stopping_enabled_can_be_disabled(self):
        """Test that early_stopping_enabled can be set to False."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(early_stopping_enabled=False)
        assert config.early_stopping_enabled is False

    def test_lora_target_modules_includes_feedforward(self):
        """Test that lora_target_modules includes fc1 and fc2 by default."""
        from model.training.config import TrainingConfig

        config = TrainingConfig()
        assert "fc1" in config.lora_target_modules
        assert "fc2" in config.lora_target_modules
        assert "q_proj" in config.lora_target_modules
        assert "v_proj" in config.lora_target_modules
        assert "k_proj" in config.lora_target_modules
        assert "out_proj" in config.lora_target_modules

    def test_custom_lora_target_modules(self):
        """Test that lora_target_modules can be customized."""
        from model.training.config import TrainingConfig

        custom_modules = ["q_proj", "v_proj"]
        config = TrainingConfig(lora_target_modules=custom_modules)
        assert config.lora_target_modules == custom_modules

    def test_validate_missing_dataset_path(self):
        """Test validation fails when dataset_path is empty."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(adapter_name="test")

        with pytest.raises(ValueError, match="dataset_path is required"):
            config.validate()

    def test_validate_missing_adapter_name(self):
        """Test validation fails when adapter_name is empty."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(dataset_path="/path/to/data")

        with pytest.raises(ValueError, match="adapter_name is required"):
            config.validate()

    def test_validate_invalid_dataset_type(self):
        """Test validation fails for invalid dataset_type."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(
            dataset_path="/path/to/data",
            adapter_name="test",
            dataset_type="invalid",
        )

        with pytest.raises(ValueError, match="dataset_type must be"):
            config.validate()

    def test_validate_supervised_dataset_type(self):
        """Test validation passes for supervised dataset_type."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(
            dataset_path="/path/to/data",
            adapter_name="test",
            dataset_type="supervised",
        )

        # Should not raise
        config.validate()

    def test_validate_preference_dataset_type(self):
        """Test validation passes for preference dataset_type."""
        from model.training.config import TrainingConfig

        config = TrainingConfig(
            dataset_path="/path/to/data",
            adapter_name="test",
            dataset_type="preference",
        )

        # Should not raise
        config.validate()

    def test_from_dict_basic(self):
        """Test creating config from dict with basic fields."""
        from model.training.config import TrainingConfig

        data = {
            "dataset_path": "/path/to/data",
            "adapter_name": "test-adapter",
            "num_epochs": 5,
            "batch_size": 4,
        }

        config = TrainingConfig.from_dict(data)

        assert config.dataset_path == "/path/to/data"
        assert config.adapter_name == "test-adapter"
        assert config.num_epochs == 5
        assert config.batch_size == 4

    def test_from_dict_with_early_stopping(self):
        """Test creating config from dict with early stopping fields."""
        from model.training.config import TrainingConfig

        data = {
            "dataset_path": "/path/to/data",
            "adapter_name": "test",
            "early_stopping_enabled": False,
            "early_stopping_patience": 10,
            "early_stopping_threshold": 0.001,
        }

        config = TrainingConfig.from_dict(data)

        assert config.early_stopping_enabled is False
        assert config.early_stopping_patience == 10
        assert config.early_stopping_threshold == 0.001

    def test_from_dict_ignores_unknown_fields(self):
        """Test that from_dict ignores fields not in dataclass."""
        from model.training.config import TrainingConfig

        data = {
            "dataset_path": "/path/to/data",
            "unknown_field": "should be ignored",
            "another_unknown": 123,
        }

        # Should not raise
        config = TrainingConfig.from_dict(data)
        assert config.dataset_path == "/path/to/data"
        assert not hasattr(config, "unknown_field")

    def test_from_dict_with_lora_target_modules(self):
        """Test creating config from dict with lora_target_modules."""
        from model.training.config import TrainingConfig

        data = {
            "dataset_path": "/path/to/data",
            "lora_target_modules": ["q_proj", "k_proj"],
        }

        config = TrainingConfig.from_dict(data)

        assert config.lora_target_modules == ["q_proj", "k_proj"]


class TestTrainingConfigIntegration:
    """Integration tests for TrainingConfig with other components."""

    def test_config_serialization(self):
        """Test that config can be serialized to dict."""
        from dataclasses import asdict

        from model.training.config import TrainingConfig

        config = TrainingConfig(
            dataset_path="/path/to/data",
            adapter_name="test",
            early_stopping_enabled=False,
            lora_target_modules=["q_proj", "v_proj"],
        )

        config_dict = asdict(config)

        assert config_dict["dataset_path"] == "/path/to/data"
        assert config_dict["adapter_name"] == "test"
        assert config_dict["early_stopping_enabled"] is False
        assert config_dict["lora_target_modules"] == ["q_proj", "v_proj"]

    def test_config_roundtrip(self):
        """Test config can be serialized and deserialized."""
        from dataclasses import asdict

        from model.training.config import TrainingConfig

        original = TrainingConfig(
            dataset_path="/path/to/data",
            adapter_name="test",
            num_epochs=10,
            early_stopping_enabled=False,
            lora_target_modules=["q_proj"],
        )

        config_dict = asdict(original)
        restored = TrainingConfig.from_dict(config_dict)

        assert restored.dataset_path == original.dataset_path
        assert restored.adapter_name == original.adapter_name
        assert restored.num_epochs == original.num_epochs
        assert restored.early_stopping_enabled == original.early_stopping_enabled
        assert restored.lora_target_modules == original.lora_target_modules
