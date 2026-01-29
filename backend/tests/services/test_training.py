"""Tests for training service."""

import sys
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.dataset import DatasetType
from app.models.experiment import ExperimentStatus, RunStatus


class TestTrainingServiceBuildCommand:
    """Tests for TrainingService._build_training_command method."""

    def test_build_command_supervised(self):
        """Test building command for supervised training."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={},
        )

        assert cmd[0] == sys.executable
        assert "-m" in cmd
        assert "model.training.cli" in cmd
        assert "train" in cmd
        assert "--dataset" in cmd
        assert "/path/to/dataset/train.jsonl" in cmd
        assert "--type" in cmd
        assert "supervised" in cmd
        assert "--output" in cmd
        assert "/path/to/output" in cmd
        assert "--name" in cmd
        assert "test-adapter" in cmd
        assert "--version" in cmd

    def test_build_command_preference(self):
        """Test building command for preference training."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.PREFERENCE,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={},
        )

        assert "preferences.jsonl" in " ".join(cmd)
        assert "preference" in cmd

    def test_build_command_with_epochs(self):
        """Test building command with epochs config (legacy field name)."""
        from app.services.training import TrainingService

        # Note: The service now uses num_epochs instead of epochs
        # This test is kept for backward compatibility documentation
        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"num_epochs": 5},
        )

        assert "--epochs" in cmd
        assert "5" in cmd

    def test_build_command_with_batch_size(self):
        """Test building command with batch_size config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"batch_size": 8},
        )

        assert "--batch-size" in cmd
        assert "8" in cmd

    def test_build_command_with_learning_rate(self):
        """Test building command with learning_rate config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"learning_rate": 0.001},
        )

        assert "--lr" in cmd
        assert "0.001" in cmd

    def test_build_command_with_lora_params(self):
        """Test building command with LoRA parameters."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"lora_r": 16, "lora_alpha": 32},
        )

        assert "--lora-r" in cmd
        assert "16" in cmd
        assert "--lora-alpha" in cmd
        assert "32" in cmd

    def test_build_command_with_base_model(self):
        """Test building command with custom base model."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"base_model": "facebook/musicgen-medium"},
        )

        assert "--base-model" in cmd
        assert "facebook/musicgen-medium" in cmd

    def test_build_command_with_dpo_beta(self):
        """Test building command with DPO beta parameter."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.PREFERENCE,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"dpo_beta": 0.1},
        )

        assert "--beta" in cmd
        assert "0.1" in cmd

    def test_build_command_with_all_config_options(self):
        """Test building command with all config options."""
        from app.services.training import TrainingService

        config = {
            "num_epochs": 10,
            "batch_size": 16,
            "learning_rate": 0.0001,
            "lora_r": 8,
            "lora_alpha": 16,
            "base_model": "facebook/musicgen-small",
            "dpo_beta": 0.2,
        }

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.PREFERENCE,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config=config,
        )

        assert "--epochs" in cmd
        assert "--batch-size" in cmd
        assert "--lr" in cmd
        assert "--lora-r" in cmd
        assert "--lora-alpha" in cmd
        assert "--base-model" in cmd
        assert "--beta" in cmd

    def test_build_command_with_num_epochs(self):
        """Test building command with num_epochs config (new field name)."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"num_epochs": 10},
        )

        assert "--epochs" in cmd
        assert "10" in cmd

    def test_build_command_with_lora_dropout(self):
        """Test building command with lora_dropout config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"lora_dropout": 0.1},
        )

        assert "--lora-dropout" in cmd
        assert "0.1" in cmd

    def test_build_command_with_gradient_accumulation_steps(self):
        """Test building command with gradient_accumulation_steps config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"gradient_accumulation_steps": 8},
        )

        assert "--gradient-accumulation-steps" in cmd
        assert "8" in cmd

    def test_build_command_with_warmup_steps(self):
        """Test building command with warmup_steps config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"warmup_steps": 200},
        )

        assert "--warmup-steps" in cmd
        assert "200" in cmd

    def test_build_command_with_weight_decay(self):
        """Test building command with weight_decay config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"weight_decay": 0.02},
        )

        assert "--weight-decay" in cmd
        assert "0.02" in cmd

    def test_build_command_with_max_grad_norm(self):
        """Test building command with max_grad_norm config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"max_grad_norm": 0.5},
        )

        assert "--max-grad-norm" in cmd
        assert "0.5" in cmd

    def test_build_command_with_fp16(self):
        """Test building command with fp16 config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"fp16": True},
        )

        assert "--fp16" in cmd
        assert "true" in cmd

    def test_build_command_with_fp16_disabled(self):
        """Test building command with fp16 disabled."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"fp16": False},
        )

        assert "--fp16" in cmd
        assert "false" in cmd

    def test_build_command_with_save_steps(self):
        """Test building command with save_steps config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"save_steps": 1000},
        )

        assert "--save-steps" in cmd
        assert "1000" in cmd

    def test_build_command_with_save_total_limit(self):
        """Test building command with save_total_limit config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"save_total_limit": 5},
        )

        assert "--save-total-limit" in cmd
        assert "5" in cmd

    def test_build_command_with_eval_steps(self):
        """Test building command with eval_steps config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"eval_steps": 200},
        )

        assert "--eval-steps" in cmd
        assert "200" in cmd

    def test_build_command_with_early_stopping_enabled(self):
        """Test building command with early_stopping_enabled config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"early_stopping_enabled": True},
        )

        assert "--early-stopping-enabled" in cmd
        assert "true" in cmd

    def test_build_command_with_early_stopping_disabled(self):
        """Test building command with early_stopping_enabled=False."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"early_stopping_enabled": False},
        )

        assert "--early-stopping-enabled" in cmd
        assert "false" in cmd

    def test_build_command_with_early_stopping_patience(self):
        """Test building command with early_stopping_patience config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"early_stopping_patience": 5},
        )

        assert "--early-stopping-patience" in cmd
        assert "5" in cmd

    def test_build_command_with_early_stopping_threshold(self):
        """Test building command with early_stopping_threshold config."""
        from app.services.training import TrainingService

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.SUPERVISED,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config={"early_stopping_threshold": 0.001},
        )

        assert "--early-stopping-threshold" in cmd
        assert "0.001" in cmd

    def test_build_command_with_all_new_config_options(self):
        """Test building command with all new config options."""
        from app.services.training import TrainingService

        config = {
            "num_epochs": 5,
            "batch_size": 4,
            "learning_rate": 5e-5,
            "lora_r": 32,
            "lora_alpha": 64,
            "lora_dropout": 0.1,
            "base_model": "facebook/musicgen-medium",
            "dpo_beta": 0.15,
            "gradient_accumulation_steps": 8,
            "warmup_steps": 200,
            "weight_decay": 0.02,
            "max_grad_norm": 0.5,
            "fp16": True,
            "save_steps": 1000,
            "save_total_limit": 5,
            "eval_steps": 200,
            "early_stopping_enabled": True,
            "early_stopping_patience": 5,
            "early_stopping_threshold": 0.005,
        }

        cmd = TrainingService._build_training_command(
            dataset_path="/path/to/dataset",
            dataset_type=DatasetType.PREFERENCE,
            output_dir="/path/to/output",
            adapter_name="test-adapter",
            config=config,
        )

        # Verify all new parameters are included
        assert "--epochs" in cmd
        assert "--batch-size" in cmd
        assert "--lr" in cmd
        assert "--lora-r" in cmd
        assert "--lora-alpha" in cmd
        assert "--lora-dropout" in cmd
        assert "--base-model" in cmd
        assert "--beta" in cmd
        assert "--gradient-accumulation-steps" in cmd
        assert "--warmup-steps" in cmd
        assert "--weight-decay" in cmd
        assert "--max-grad-norm" in cmd
        assert "--fp16" in cmd
        assert "--save-steps" in cmd
        assert "--save-total-limit" in cmd
        assert "--eval-steps" in cmd
        assert "--early-stopping-enabled" in cmd
        assert "--early-stopping-patience" in cmd
        assert "--early-stopping-threshold" in cmd


class TestTrainingServiceRegisterAdapter:
    """Tests for TrainingService._register_adapter method."""

    @pytest.mark.asyncio
    async def test_register_adapter_no_output(self):
        """Test register adapter when output doesn't exist."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()
        mock_experiment.name = "test-experiment"
        mock_dataset = MagicMock()
        mock_dataset.id = uuid4()

        with patch("os.path.exists", return_value=False):
            adapter_id, final_loss = await TrainingService._register_adapter(
                db=mock_db,
                output_dir="/nonexistent/path",
                adapter_name="test-adapter",
                experiment=mock_experiment,
                dataset=mock_dataset,
            )

        assert adapter_id is None
        assert final_loss is None

    @pytest.mark.asyncio
    async def test_register_adapter_with_output(self):
        """Test register adapter with valid output."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()
        mock_experiment.name = "test-experiment"
        mock_dataset = MagicMock()
        mock_dataset.id = uuid4()

        adapter_id = uuid4()

        async def mock_refresh(obj):
            obj.id = adapter_id

        mock_db.refresh = mock_refresh

        with patch("os.path.exists", side_effect=lambda x: "final" in x):
            result_id, final_loss = await TrainingService._register_adapter(
                db=mock_db,
                output_dir="/path/to/output",
                adapter_name="test-adapter",
                experiment=mock_experiment,
                dataset=mock_dataset,
            )

        assert result_id == adapter_id
        assert final_loss is None  # No config file
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_adapter_with_training_config(self):
        """Test register adapter loads training config."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()
        mock_experiment.name = "test-experiment"
        mock_dataset = MagicMock()
        mock_dataset.id = uuid4()

        adapter_id = uuid4()

        async def mock_refresh(obj):
            obj.id = adapter_id

        mock_db.refresh = mock_refresh

        training_config = {"base_model": "facebook/musicgen-small", "final_loss": 0.123}

        def exists_side_effect(path):
            return "final" in path or "training_config.json" in path

        with (
            patch("os.path.exists", side_effect=exists_side_effect),
            patch("builtins.open", MagicMock()),
            patch("json.load", return_value=training_config),
        ):
            result_id, final_loss = await TrainingService._register_adapter(
                db=mock_db,
                output_dir="/path/to/output",
                adapter_name="test-adapter",
                experiment=mock_experiment,
                dataset=mock_dataset,
            )

        assert result_id == adapter_id
        assert final_loss == 0.123


class TestTrainingServiceUpdateExperimentStatus:
    """Tests for TrainingService._update_experiment_status method."""

    @pytest.mark.asyncio
    async def test_update_status_no_experiment(self):
        """Test update status when experiment not found."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_no_runs(self):
        """Test update status when no runs exist."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()

        mock_exp_result = MagicMock()
        mock_exp_result.scalar_one_or_none.return_value = mock_experiment

        mock_runs_result = MagicMock()
        mock_runs_scalars = MagicMock()
        mock_runs_scalars.all.return_value = []
        mock_runs_result.scalars.return_value = mock_runs_scalars

        mock_db.execute = AsyncMock(side_effect=[mock_exp_result, mock_runs_result])

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        assert mock_experiment.status == ExperimentStatus.DRAFT
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_status_running(self):
        """Test update status when a run is running."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()

        mock_exp_result = MagicMock()
        mock_exp_result.scalar_one_or_none.return_value = mock_experiment

        mock_run = MagicMock()
        mock_run.status = RunStatus.RUNNING

        mock_runs_result = MagicMock()
        mock_runs_scalars = MagicMock()
        mock_runs_scalars.all.return_value = [mock_run]
        mock_runs_result.scalars.return_value = mock_runs_scalars

        mock_db.execute = AsyncMock(side_effect=[mock_exp_result, mock_runs_result])

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        assert mock_experiment.status == ExperimentStatus.RUNNING

    @pytest.mark.asyncio
    async def test_update_status_completed_with_best_run(self):
        """Test update status when all runs completed."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()

        mock_exp_result = MagicMock()
        mock_exp_result.scalar_one_or_none.return_value = mock_experiment

        mock_run1 = MagicMock()
        mock_run1.id = uuid4()
        mock_run1.status = RunStatus.COMPLETED
        mock_run1.final_loss = 0.5

        mock_run2 = MagicMock()
        mock_run2.id = uuid4()
        mock_run2.status = RunStatus.COMPLETED
        mock_run2.final_loss = 0.3  # Better

        mock_runs_result = MagicMock()
        mock_runs_scalars = MagicMock()
        mock_runs_scalars.all.return_value = [mock_run1, mock_run2]
        mock_runs_result.scalars.return_value = mock_runs_scalars

        mock_db.execute = AsyncMock(side_effect=[mock_exp_result, mock_runs_result])

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        assert mock_experiment.status == ExperimentStatus.COMPLETED
        assert mock_experiment.best_run_id == mock_run2.id
        assert mock_experiment.best_loss == 0.3

    @pytest.mark.asyncio
    async def test_update_status_failed(self):
        """Test update status when a run failed."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()

        mock_exp_result = MagicMock()
        mock_exp_result.scalar_one_or_none.return_value = mock_experiment

        mock_run = MagicMock()
        mock_run.status = RunStatus.FAILED

        mock_runs_result = MagicMock()
        mock_runs_scalars = MagicMock()
        mock_runs_scalars.all.return_value = [mock_run]
        mock_runs_result.scalars.return_value = mock_runs_scalars

        mock_db.execute = AsyncMock(side_effect=[mock_exp_result, mock_runs_result])

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        assert mock_experiment.status == ExperimentStatus.FAILED

    @pytest.mark.asyncio
    async def test_update_status_cancelled(self):
        """Test update status when all runs cancelled."""
        from app.services.training import TrainingService

        mock_db = AsyncMock()
        mock_experiment = MagicMock()

        mock_exp_result = MagicMock()
        mock_exp_result.scalar_one_or_none.return_value = mock_experiment

        mock_run = MagicMock()
        mock_run.status = RunStatus.CANCELLED

        mock_runs_result = MagicMock()
        mock_runs_scalars = MagicMock()
        mock_runs_scalars.all.return_value = [mock_run]
        mock_runs_result.scalars.return_value = mock_runs_scalars

        mock_db.execute = AsyncMock(side_effect=[mock_exp_result, mock_runs_result])

        await TrainingService._update_experiment_status(uuid4(), mock_db)

        assert mock_experiment.status == ExperimentStatus.COMPLETED  # All non-running
