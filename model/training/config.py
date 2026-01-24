from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path


@dataclass
class TrainingConfig:
    # Dataset
    dataset_path: str = ""
    dataset_type: str = "supervised"  # or "preference"

    # Model
    base_model: str = "facebook/musicgen-small"
    model_cache_dir: str = "./model_cache"

    # LoRA
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    lora_target_modules: list[str] = field(
        default_factory=lambda: ["q_proj", "v_proj", "k_proj", "out_proj"]
    )

    # Training
    output_dir: str = "./output"
    num_epochs: int = 3
    batch_size: int = 2
    gradient_accumulation_steps: int = 4
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    warmup_steps: int = 100
    max_grad_norm: float = 1.0

    # DPO (for preference training)
    dpo_beta: float = 0.1

    # Checkpointing
    save_steps: int = 500
    save_total_limit: int = 3
    eval_steps: int = 100

    # Early stopping
    early_stopping_patience: int = 3
    early_stopping_threshold: float = 0.01

    # Hardware
    fp16: bool = True
    device: str = "cuda"

    # Logging
    logging_steps: int = 10
    log_dir: str = "./logs"

    # Adapter registration
    adapter_name: str = ""
    adapter_version: str = "1.0.0"
    adapter_description: str = ""

    def validate(self):
        if not self.dataset_path:
            raise ValueError("dataset_path is required")
        if not self.adapter_name:
            raise ValueError("adapter_name is required")
        if self.dataset_type not in ["supervised", "preference"]:
            raise ValueError("dataset_type must be 'supervised' or 'preference'")

    @classmethod
    def from_dict(cls, data: dict) -> "TrainingConfig":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
