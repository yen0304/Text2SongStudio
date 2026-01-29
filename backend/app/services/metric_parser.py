"""
Metric Parser Service

Parses training log output to extract metrics (loss, learning rate, step number).
Handles both supervised and DPO training formats.
"""

import re
from datetime import datetime
from typing import TypedDict


class MetricDataPoint(TypedDict):
    """A single metric data point."""

    step: int
    value: float
    timestamp: str


class ParsedMetrics(TypedDict, total=False):
    """Parsed metrics from a log chunk."""

    loss: list[MetricDataPoint]
    learning_rate: list[MetricDataPoint]
    grad_norm: list[MetricDataPoint]
    epoch: list[MetricDataPoint]
    # DPO-specific metrics
    rewards_chosen: list[MetricDataPoint]
    rewards_rejected: list[MetricDataPoint]


# Regex patterns for extracting metrics from log lines
# Patterns support various log formats from different training frameworks
METRIC_PATTERNS = {
    # Standard step-based loss patterns
    # e.g., "Step 100: loss=1.2345" or "Step 100 - loss: 1.2345" or "step 100, loss 1.2345"
    "step_loss": re.compile(
        r"[Ss]tep[\s:]+(\d+).*?(?:loss|Loss)[=:\s]+([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)",
        re.IGNORECASE,
    ),
    # Epoch average loss pattern (preferred - more precise value)
    # e.g., "Epoch 2 average loss: 1.1234" or "INFO - Epoch 2 average loss: 9.0916"
    "epoch_avg_loss": re.compile(
        r"[Ee]poch[\s:]+(\d+)\s+average\s+loss[=:\s]+([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)",
        re.IGNORECASE,
    ),
    # Epoch progress bar loss (fallback - truncated value from tqdm)
    # e.g., "Epoch 1: 100%|██████████| 1/1 [00:01<00:00,  1.65s/it, loss=9.09]"
    "epoch_progress_loss": re.compile(
        r"[Ee]poch[\s:]+(\d+).*\|.*loss[=:\s]+([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)",
        re.IGNORECASE,
    ),
    # Learning rate patterns
    # e.g., "lr=1.00e-04" or "learning_rate: 0.0001" or "LR: 1e-4"
    "learning_rate": re.compile(
        r"(?:lr|learning[_\s]?rate)[=:\s]+([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)",
        re.IGNORECASE,
    ),
    # Gradient norm patterns
    # e.g., "grad_norm=1.234" or "gradient_norm: 1.234" or "grad norm: 1.234"
    "grad_norm": re.compile(
        r"(?:grad[_\s]?norm|gradient[_\s]?norm)[=:\s]+([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)",
        re.IGNORECASE,
    ),
    # Step number extraction (when not paired with loss)
    # e.g., "Step 100" or "step: 100" or "iteration 100"
    "step_only": re.compile(r"(?:[Ss]tep|[Ii]teration)[\s:]+(\d+)", re.IGNORECASE),
    # Global step pattern (commonly used in transformers)
    # e.g., "global_step = 100"
    "global_step": re.compile(r"global[_\s]?step[\s=:]+(\d+)", re.IGNORECASE),
    # DPO-specific patterns
    # e.g., "rewards/chosen=1.234" or "rewards_chosen: 1.234" or "rewards/chosen=-0.5"
    "rewards_chosen": re.compile(
        r"rewards[/_]chosen[=:\s]+(-?[0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)", re.IGNORECASE
    ),
    "rewards_rejected": re.compile(
        r"rewards[/_]rejected[=:\s]+(-?[0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)", re.IGNORECASE
    ),
    # Training progress patterns (huggingface trainer style)
    # e.g., {'loss': 1.234, 'learning_rate': 0.0001, 'epoch': 1.0}
    "hf_trainer_dict": re.compile(
        r"['\"]loss['\"]:\s*([0-9]+\.?[0-9]*(?:[eE][+-]?\d+)?)", re.IGNORECASE
    ),
}


class MetricParser:
    """Parses training logs to extract metrics."""

    def __init__(self, max_points_per_metric: int = 2000):
        """
        Initialize the metric parser.

        Args:
            max_points_per_metric: Maximum number of data points to keep per metric.
                                   Older points are downsampled when exceeded.
        """
        self.max_points_per_metric = max_points_per_metric
        self._current_step = 0

    def parse_log_line(self, line: str, timestamp: str | None = None) -> ParsedMetrics:
        """
        Parse a single log line for metrics.

        Args:
            line: A single line from the training log
            timestamp: ISO timestamp for the data point. Defaults to current time.

        Returns:
            ParsedMetrics dict with any extracted metrics
        """
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat() + "Z"

        metrics: ParsedMetrics = {}

        # Extract step number first (need it for other metrics)
        step = self._extract_step(line)
        if step is not None:
            self._current_step = step

        # Try step-loss pattern first (most common)
        step_loss_match = METRIC_PATTERNS["step_loss"].search(line)
        if step_loss_match:
            step_num = int(step_loss_match.group(1))
            loss_value = float(step_loss_match.group(2))
            self._current_step = step_num
            metrics["loss"] = [
                {"step": step_num, "value": loss_value, "timestamp": timestamp}
            ]

        # Try epoch average loss pattern (preferred - more precise value)
        epoch_avg_match = METRIC_PATTERNS["epoch_avg_loss"].search(line)
        if epoch_avg_match and "loss" not in metrics:
            epoch_num = int(epoch_avg_match.group(1))
            loss_value = float(epoch_avg_match.group(2))
            # Use epoch number directly as the step for epoch-based training
            metrics["loss"] = [
                {"step": epoch_num, "value": loss_value, "timestamp": timestamp}
            ]
            metrics["epoch"] = [
                {"step": epoch_num, "value": float(epoch_num), "timestamp": timestamp}
            ]
            self._current_step = epoch_num

        # Try epoch progress bar loss pattern (fallback - less precise)
        # Only use if we haven't found a loss value yet
        epoch_progress_match = METRIC_PATTERNS["epoch_progress_loss"].search(line)
        if epoch_progress_match and "loss" not in metrics:
            epoch_num = int(epoch_progress_match.group(1))
            loss_value = float(epoch_progress_match.group(2))
            # Use epoch number directly as the step
            metrics["loss"] = [
                {"step": epoch_num, "value": loss_value, "timestamp": timestamp}
            ]
            metrics["epoch"] = [
                {"step": epoch_num, "value": float(epoch_num), "timestamp": timestamp}
            ]
            self._current_step = epoch_num

        # Try HF trainer dict pattern
        hf_match = METRIC_PATTERNS["hf_trainer_dict"].search(line)
        if hf_match and "loss" not in metrics:
            loss_value = float(hf_match.group(1))
            step_num = self._current_step if self._current_step > 0 else 1
            metrics["loss"] = [
                {"step": step_num, "value": loss_value, "timestamp": timestamp}
            ]

        # Extract learning rate
        lr_match = METRIC_PATTERNS["learning_rate"].search(line)
        if lr_match:
            lr_value = float(lr_match.group(1))
            step_num = self._current_step if self._current_step > 0 else 1
            metrics["learning_rate"] = [
                {"step": step_num, "value": lr_value, "timestamp": timestamp}
            ]

        # Extract gradient norm
        grad_match = METRIC_PATTERNS["grad_norm"].search(line)
        if grad_match:
            grad_value = float(grad_match.group(1))
            step_num = self._current_step if self._current_step > 0 else 1
            metrics["grad_norm"] = [
                {"step": step_num, "value": grad_value, "timestamp": timestamp}
            ]

        # Extract DPO metrics
        rewards_chosen_match = METRIC_PATTERNS["rewards_chosen"].search(line)
        if rewards_chosen_match:
            value = float(rewards_chosen_match.group(1))
            step_num = self._current_step if self._current_step > 0 else 1
            metrics["rewards_chosen"] = [
                {"step": step_num, "value": value, "timestamp": timestamp}
            ]

        rewards_rejected_match = METRIC_PATTERNS["rewards_rejected"].search(line)
        if rewards_rejected_match:
            value = float(rewards_rejected_match.group(1))
            step_num = self._current_step if self._current_step > 0 else 1
            metrics["rewards_rejected"] = [
                {"step": step_num, "value": value, "timestamp": timestamp}
            ]

        return metrics

    def _extract_step(self, line: str) -> int | None:
        """Extract step number from a log line."""
        # Try global_step first
        global_match = METRIC_PATTERNS["global_step"].search(line)
        if global_match:
            return int(global_match.group(1))

        # Try regular step patterns
        step_match = METRIC_PATTERNS["step_only"].search(line)
        if step_match:
            return int(step_match.group(1))

        return None

    def parse_log_chunk(
        self, chunk: str | bytes, timestamp: str | None = None
    ) -> ParsedMetrics:
        """
        Parse a chunk of log data (possibly multiple lines).

        Args:
            chunk: Log data (string or bytes)
            timestamp: ISO timestamp for the data points

        Returns:
            ParsedMetrics dict with all extracted metrics from the chunk
        """
        if isinstance(chunk, bytes):
            try:
                chunk = chunk.decode("utf-8", errors="replace")
            except Exception:
                return {}

        if timestamp is None:
            timestamp = datetime.utcnow().isoformat() + "Z"

        combined_metrics: ParsedMetrics = {}

        # Split into lines and parse each
        lines = chunk.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue

            line_metrics = self.parse_log_line(line, timestamp)

            # Merge metrics with deduplication
            combined_metrics = self.merge_metrics(combined_metrics, line_metrics)

        return combined_metrics

    @staticmethod
    def merge_metrics(existing: dict | None, new_metrics: ParsedMetrics) -> dict:
        """
        Merge new metrics into existing metrics dict, deduplicating by step.
        When duplicate steps exist, keeps the value with more decimal precision
        (assumes more precise values come from explicit logging vs progress bars).

        Args:
            existing: Existing metrics dict (from ExperimentRun.metrics)
            new_metrics: New parsed metrics to add

        Returns:
            Updated metrics dict
        """
        if existing is None:
            existing = {}

        for metric_name, data_points in new_metrics.items():
            if metric_name not in existing:
                existing[metric_name] = []

            # Build a map by step, keeping more precise values
            step_map: dict[int, dict] = {}
            for point in existing[metric_name]:
                step = point.get("step", 0)
                step_map[step] = point

            for point in data_points:
                step = point.get("step", 0)
                if step in step_map:
                    # Compare precision: more decimal places = more precise
                    existing_val = step_map[step].get("value", 0)
                    new_val = point.get("value", 0)
                    existing_str = str(existing_val)
                    new_str = str(new_val)
                    # Count digits after decimal point
                    existing_decimals = (
                        len(existing_str.split(".")[-1]) if "." in existing_str else 0
                    )
                    new_decimals = len(new_str.split(".")[-1]) if "." in new_str else 0
                    if new_decimals > existing_decimals:
                        step_map[step] = point
                else:
                    step_map[step] = point

            # Convert back to sorted list
            existing[metric_name] = sorted(
                step_map.values(), key=lambda x: x.get("step", 0)
            )

        return existing

    @staticmethod
    def downsample_metrics(metrics: dict, max_points: int = 2000) -> dict:
        """
        Downsample metrics to keep size manageable.

        Uses a simple strategy: keep first, last, and evenly distributed middle points.

        Args:
            metrics: Metrics dict to downsample
            max_points: Maximum points per metric

        Returns:
            Downsampled metrics dict
        """
        downsampled = {}

        for metric_name, data_points in metrics.items():
            if not isinstance(data_points, list):
                downsampled[metric_name] = data_points
                continue

            if len(data_points) <= max_points:
                downsampled[metric_name] = data_points
                continue

            # Keep first and last points, sample middle
            step = len(data_points) / max_points
            indices = [int(i * step) for i in range(max_points - 1)]
            indices.append(len(data_points) - 1)  # Ensure we keep the last point

            downsampled[metric_name] = [data_points[i] for i in indices]

        return downsampled

    @staticmethod
    def get_final_loss(metrics: dict | None) -> float | None:
        """
        Get the final loss value from metrics.

        Args:
            metrics: Metrics dict

        Returns:
            The last loss value, or None if no loss data
        """
        if not metrics or "loss" not in metrics:
            return None

        loss_data = metrics.get("loss", [])
        if not loss_data:
            return None

        # Sort by step and get the last value
        sorted_loss = sorted(loss_data, key=lambda x: x.get("step", 0))
        return sorted_loss[-1].get("value") if sorted_loss else None
