"""Tests for the metric parsing service."""

import pytest

from app.services.metric_parser import METRIC_PATTERNS, MetricParser


class TestMetricPatterns:
    """Test regex patterns match expected log formats."""

    def test_step_loss_pattern_basic(self):
        """Test basic step-loss pattern matching."""
        pattern = METRIC_PATTERNS["step_loss"]

        # Standard formats
        assert pattern.search("Step 100: loss=1.2345")
        assert pattern.search("step 100 - loss: 1.2345")
        assert pattern.search("Step: 100, loss 1.2345")
        assert pattern.search("STEP 50: Loss=2.5")

    def test_step_loss_pattern_scientific_notation(self):
        """Test step-loss pattern with scientific notation."""
        pattern = METRIC_PATTERNS["step_loss"]

        match = pattern.search("Step 100: loss=1.23e-04")
        assert match
        assert match.group(2) == "1.23e-04"

        match = pattern.search("Step 100: loss=1.5E+02")
        assert match
        assert match.group(2) == "1.5E+02"

    def test_epoch_loss_patterns(self):
        """Test epoch-loss pattern matching."""
        # Test epoch average loss pattern (preferred)
        pattern_avg = METRIC_PATTERNS["epoch_avg_loss"]
        assert pattern_avg.search("Epoch 2 average loss: 1.1234")
        assert pattern_avg.search("INFO - Epoch 1 average loss: 9.0916")

        # Test epoch progress bar loss pattern (fallback)
        pattern_progress = METRIC_PATTERNS["epoch_progress_loss"]
        assert pattern_progress.search(
            "Epoch 1: 100%|██████████| 1/1 [00:01<00:00, loss=9.09]"
        )

    def test_learning_rate_pattern(self):
        """Test learning rate pattern matching."""
        pattern = METRIC_PATTERNS["learning_rate"]

        # Various LR formats
        assert pattern.search("lr=1.00e-04")
        assert pattern.search("learning_rate: 0.0001")
        assert pattern.search("LR: 1e-4")
        assert pattern.search("learning rate: 5e-5")

        match = pattern.search("lr=1.00e-04")
        assert match.group(1) == "1.00e-04"

    def test_grad_norm_pattern(self):
        """Test gradient norm pattern matching."""
        pattern = METRIC_PATTERNS["grad_norm"]

        assert pattern.search("grad_norm=1.234")
        assert pattern.search("gradient_norm: 2.5")
        assert pattern.search("grad norm: 0.123")

    def test_global_step_pattern(self):
        """Test global step pattern matching."""
        pattern = METRIC_PATTERNS["global_step"]

        assert pattern.search("global_step = 100")
        assert pattern.search("global step: 50")
        assert pattern.search("globalstep=200")

    def test_dpo_rewards_patterns(self):
        """Test DPO rewards patterns."""
        chosen = METRIC_PATTERNS["rewards_chosen"]
        rejected = METRIC_PATTERNS["rewards_rejected"]

        assert chosen.search("rewards/chosen=1.234")
        assert chosen.search("rewards_chosen: 1.5")

        assert rejected.search("rewards/rejected=-0.5")
        assert rejected.search("rewards_rejected: -1.234")


class TestMetricParser:
    """Test MetricParser class."""

    @pytest.fixture
    def parser(self):
        """Create a fresh parser for each test."""
        return MetricParser()

    def test_parse_single_step_loss(self, parser):
        """Test parsing a single step with loss."""
        metrics = parser.parse_log_line("Step 100: loss=1.2345")

        assert "loss" in metrics
        assert len(metrics["loss"]) == 1
        assert metrics["loss"][0]["step"] == 100
        assert metrics["loss"][0]["value"] == 1.2345
        assert "timestamp" in metrics["loss"][0]

    def test_parse_with_custom_timestamp(self, parser):
        """Test parsing with custom timestamp."""
        timestamp = "2026-01-28T12:00:00Z"
        metrics = parser.parse_log_line("Step 100: loss=1.0", timestamp=timestamp)

        assert metrics["loss"][0]["timestamp"] == timestamp

    def test_parse_learning_rate(self, parser):
        """Test parsing learning rate."""
        # First set a step
        parser.parse_log_line("Step 50: loss=1.0")

        metrics = parser.parse_log_line("lr=1.00e-04")

        assert "learning_rate" in metrics
        assert metrics["learning_rate"][0]["value"] == pytest.approx(1e-4)
        assert metrics["learning_rate"][0]["step"] == 50

    def test_parse_grad_norm(self, parser):
        """Test parsing gradient norm."""
        parser.parse_log_line("Step 100: loss=1.0")
        metrics = parser.parse_log_line("grad_norm=2.5")

        assert "grad_norm" in metrics
        assert metrics["grad_norm"][0]["value"] == 2.5

    def test_parse_multi_metric_line(self, parser):
        """Test parsing a line with multiple metrics."""
        metrics = parser.parse_log_line("Step 100: loss=1.234, lr=1e-4, grad_norm=0.5")

        assert "loss" in metrics
        assert "learning_rate" in metrics
        assert "grad_norm" in metrics

        assert metrics["loss"][0]["value"] == 1.234
        assert metrics["learning_rate"][0]["value"] == pytest.approx(1e-4)
        assert metrics["grad_norm"][0]["value"] == 0.5

    def test_parse_dpo_metrics(self, parser):
        """Test parsing DPO-specific metrics."""
        parser.parse_log_line("Step 50: loss=0.5")
        metrics = parser.parse_log_line("rewards/chosen=1.5, rewards/rejected=-0.5")

        assert "rewards_chosen" in metrics
        assert "rewards_rejected" in metrics
        assert metrics["rewards_chosen"][0]["value"] == 1.5
        assert metrics["rewards_rejected"][0]["value"] == -0.5

    def test_parse_chunk_multiple_lines(self, parser):
        """Test parsing a chunk with multiple lines."""
        chunk = """
        Step 1: loss=2.5, lr=1e-3
        Step 2: loss=2.3, lr=1e-3
        Step 3: loss=2.1, lr=1e-3
        """

        metrics = parser.parse_log_chunk(chunk)

        assert "loss" in metrics
        assert len(metrics["loss"]) == 3

        # Check values are in order
        losses = [p["value"] for p in metrics["loss"]]
        assert losses == [2.5, 2.3, 2.1]

    def test_parse_chunk_bytes(self, parser):
        """Test parsing bytes input."""
        chunk = b"Step 100: loss=1.5"
        metrics = parser.parse_log_chunk(chunk)

        assert "loss" in metrics
        assert metrics["loss"][0]["value"] == 1.5

    def test_parse_empty_line(self, parser):
        """Test parsing empty line returns empty dict."""
        metrics = parser.parse_log_line("")
        assert metrics == {}

    def test_parse_non_metric_line(self, parser):
        """Test parsing line without metrics returns empty dict."""
        metrics = parser.parse_log_line("Loading model...")
        assert metrics == {}

    def test_epoch_based_logging(self, parser):
        """Test parsing epoch-based logging format."""
        metrics = parser.parse_log_line("Epoch 2 average loss: 1.5")

        assert "loss" in metrics
        assert "epoch" in metrics
        assert metrics["loss"][0]["value"] == 1.5
        assert metrics["epoch"][0]["value"] == 2.0


class TestMetricMerging:
    """Test metric merging functionality."""

    def test_merge_to_empty(self):
        """Test merging metrics to empty dict."""
        new_metrics = {
            "loss": [{"step": 1, "value": 1.0, "timestamp": "2026-01-28T12:00:00Z"}]
        }
        result = MetricParser.merge_metrics(None, new_metrics)

        assert result == new_metrics

    def test_merge_to_existing(self):
        """Test merging metrics to existing dict."""
        existing = {
            "loss": [{"step": 1, "value": 1.0, "timestamp": "2026-01-28T12:00:00Z"}]
        }
        new_metrics = {
            "loss": [{"step": 2, "value": 0.9, "timestamp": "2026-01-28T12:01:00Z"}]
        }

        result = MetricParser.merge_metrics(existing, new_metrics)

        assert len(result["loss"]) == 2
        assert result["loss"][0]["step"] == 1
        assert result["loss"][1]["step"] == 2

    def test_merge_new_metric_type(self):
        """Test merging a new metric type."""
        existing = {
            "loss": [{"step": 1, "value": 1.0, "timestamp": "2026-01-28T12:00:00Z"}]
        }
        new_metrics = {
            "learning_rate": [
                {"step": 1, "value": 1e-4, "timestamp": "2026-01-28T12:00:00Z"}
            ]
        }

        result = MetricParser.merge_metrics(existing, new_metrics)

        assert "loss" in result
        assert "learning_rate" in result


class TestMetricDownsampling:
    """Test metric downsampling functionality."""

    def test_no_downsampling_needed(self):
        """Test that data under threshold is not downsampled."""
        metrics = {
            "loss": [
                {"step": i, "value": 1.0, "timestamp": "2026-01-28T12:00:00Z"}
                for i in range(100)
            ]
        }

        result = MetricParser.downsample_metrics(metrics, max_points=200)

        assert len(result["loss"]) == 100

    def test_downsampling_large_data(self):
        """Test downsampling of large data."""
        metrics = {
            "loss": [
                {"step": i, "value": float(i), "timestamp": "2026-01-28T12:00:00Z"}
                for i in range(5000)
            ]
        }

        result = MetricParser.downsample_metrics(metrics, max_points=100)

        assert len(result["loss"]) == 100
        # First point should be preserved
        assert result["loss"][0]["step"] == 0
        # Last point should be preserved
        assert result["loss"][-1]["step"] == 4999

    def test_downsampling_preserves_all_metrics(self):
        """Test that downsampling processes all metric types."""
        metrics = {
            "loss": [
                {"step": i, "value": 1.0, "timestamp": "2026-01-28T12:00:00Z"}
                for i in range(5000)
            ],
            "learning_rate": [
                {"step": i, "value": 1e-4, "timestamp": "2026-01-28T12:00:00Z"}
                for i in range(5000)
            ],
        }

        result = MetricParser.downsample_metrics(metrics, max_points=100)

        assert len(result["loss"]) == 100
        assert len(result["learning_rate"]) == 100


class TestGetFinalLoss:
    """Test final loss extraction."""

    def test_get_final_loss(self):
        """Test getting final loss from metrics."""
        metrics = {
            "loss": [
                {"step": 1, "value": 2.5, "timestamp": "2026-01-28T12:00:00Z"},
                {"step": 10, "value": 1.5, "timestamp": "2026-01-28T12:01:00Z"},
                {
                    "step": 5,
                    "value": 2.0,
                    "timestamp": "2026-01-28T12:00:30Z",
                },  # Out of order
            ]
        }

        final_loss = MetricParser.get_final_loss(metrics)

        # Should return the loss at the highest step (10)
        assert final_loss == 1.5

    def test_get_final_loss_empty(self):
        """Test getting final loss from empty metrics."""
        assert MetricParser.get_final_loss(None) is None
        assert MetricParser.get_final_loss({}) is None
        assert MetricParser.get_final_loss({"loss": []}) is None

    def test_get_final_loss_no_loss_metric(self):
        """Test getting final loss when no loss metric exists."""
        metrics = {
            "learning_rate": [
                {"step": 1, "value": 1e-4, "timestamp": "2026-01-28T12:00:00Z"}
            ]
        }
        assert MetricParser.get_final_loss(metrics) is None


class TestRealWorldLogFormats:
    """Test parsing of real-world log formats."""

    @pytest.fixture
    def parser(self):
        return MetricParser()

    def test_huggingface_trainer_format(self, parser):
        """Test parsing HuggingFace Trainer log format."""
        log = "{'loss': 1.234, 'learning_rate': 1e-05, 'epoch': 0.5}"

        metrics = parser.parse_log_line(log)

        assert "loss" in metrics
        assert metrics["loss"][0]["value"] == 1.234

    def test_pytorch_training_loop(self, parser):
        """Test parsing common PyTorch training loop format."""
        logs = """
        Epoch: 1/10
        Step 100/1000 - loss: 2.345 - lr: 0.001
        Step 200/1000 - loss: 2.123 - lr: 0.001
        """

        metrics = parser.parse_log_chunk(logs)

        assert "loss" in metrics
        assert len(metrics["loss"]) == 2

    def test_musicgen_fine_tuning_format(self, parser):
        """Test parsing MusicGen fine-tuning log format."""
        logs = """
        INFO - Starting training...
        INFO - Step 50: loss=1.5678, lr=5.00e-05
        INFO - Step 100: loss=1.4321, lr=5.00e-05, grad_norm=0.234
        """

        metrics = parser.parse_log_chunk(logs)

        assert "loss" in metrics
        assert len(metrics["loss"]) == 2
        assert "learning_rate" in metrics
        assert "grad_norm" in metrics
