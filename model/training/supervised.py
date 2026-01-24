"""Supervised fine-tuning script for MusicGen with LoRA."""

import json
import os
import logging
from pathlib import Path
from dataclasses import asdict

import torch
import torchaudio
from torch.utils.data import Dataset, DataLoader
from transformers import AutoProcessor, MusicgenForConditionalGeneration
from peft import LoraConfig, get_peft_model, TaskType
from tqdm import tqdm

from model.training.config import TrainingConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupervisedDataset(Dataset):
    """Dataset for supervised fine-tuning."""

    def __init__(
        self,
        data_path: str,
        processor,
        sample_rate: int = 32000,
        max_duration: float = 10.0,
    ):
        self.processor = processor
        self.sample_rate = sample_rate
        self.max_duration = max_duration
        self.max_length = int(max_duration * sample_rate)

        # Load dataset
        self.samples = []
        with open(data_path, "r") as f:
            for line in f:
                sample = json.loads(line)
                # Only include high-rated samples (4+)
                if sample.get("rating", 0) >= 4:
                    self.samples.append(sample)

        logger.info(f"Loaded {len(self.samples)} samples")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]

        # Load audio
        audio_path = sample["audio_path"]
        waveform, sr = torchaudio.load(audio_path)

        # Resample if needed
        if sr != self.sample_rate:
            resampler = torchaudio.transforms.Resample(sr, self.sample_rate)
            waveform = resampler(waveform)

        # Convert to mono if needed
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Truncate or pad
        if waveform.shape[1] > self.max_length:
            waveform = waveform[:, : self.max_length]
        elif waveform.shape[1] < self.max_length:
            padding = self.max_length - waveform.shape[1]
            waveform = torch.nn.functional.pad(waveform, (0, padding))

        # Process text
        text_inputs = self.processor(
            text=[sample["prompt"]],
            padding=True,
            return_tensors="pt",
        )

        return {
            "input_ids": text_inputs["input_ids"].squeeze(0),
            "attention_mask": text_inputs["attention_mask"].squeeze(0),
            "audio": waveform.squeeze(0),
        }


def train_supervised(config: TrainingConfig):
    """Run supervised fine-tuning."""
    config.validate()

    logger.info("Loading model and processor...")
    processor = AutoProcessor.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )
    model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )

    # Configure LoRA
    logger.info("Configuring LoRA...")
    lora_config = LoraConfig(
        r=config.lora_r,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        target_modules=config.lora_target_modules,
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Move to device
    device = torch.device(config.device if torch.cuda.is_available() else "cpu")
    model = model.to(device)

    # Create dataset and dataloader
    logger.info("Loading dataset...")
    train_dataset = SupervisedDataset(
        config.dataset_path,
        processor,
    )
    train_loader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=4,
    )

    # Optimizer
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )

    # Learning rate scheduler
    num_training_steps = len(train_loader) * config.num_epochs
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=num_training_steps,
    )

    # Training loop
    logger.info("Starting training...")
    os.makedirs(config.output_dir, exist_ok=True)

    global_step = 0
    best_loss = float("inf")
    patience_counter = 0

    for epoch in range(config.num_epochs):
        model.train()
        epoch_loss = 0.0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}")
        for batch_idx, batch in enumerate(progress_bar):
            # Move to device
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            audio = batch["audio"].to(device)

            # Forward pass
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=audio,
            )
            loss = outputs.loss / config.gradient_accumulation_steps

            # Backward pass
            loss.backward()

            if (batch_idx + 1) % config.gradient_accumulation_steps == 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), config.max_grad_norm)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

                # Logging
                if global_step % config.logging_steps == 0:
                    logger.info(
                        f"Step {global_step}: loss={loss.item() * config.gradient_accumulation_steps:.4f}, "
                        f"lr={scheduler.get_last_lr()[0]:.2e}"
                    )

                # Save checkpoint
                if global_step % config.save_steps == 0:
                    checkpoint_path = os.path.join(
                        config.output_dir, f"checkpoint-{global_step}"
                    )
                    model.save_pretrained(checkpoint_path)
                    logger.info(f"Saved checkpoint to {checkpoint_path}")

            epoch_loss += loss.item() * config.gradient_accumulation_steps
            progress_bar.set_postfix(loss=loss.item() * config.gradient_accumulation_steps)

        avg_epoch_loss = epoch_loss / len(train_loader)
        logger.info(f"Epoch {epoch + 1} average loss: {avg_epoch_loss:.4f}")

        # Early stopping
        if avg_epoch_loss < best_loss - config.early_stopping_threshold:
            best_loss = avg_epoch_loss
            patience_counter = 0
            # Save best model
            best_path = os.path.join(config.output_dir, "best")
            model.save_pretrained(best_path)
            logger.info(f"New best model saved to {best_path}")
        else:
            patience_counter += 1
            if patience_counter >= config.early_stopping_patience:
                logger.info("Early stopping triggered")
                break

    # Save final model
    final_path = os.path.join(config.output_dir, "final")
    model.save_pretrained(final_path)
    logger.info(f"Final model saved to {final_path}")

    # Save training config
    config_path = os.path.join(config.output_dir, "training_config.json")
    with open(config_path, "w") as f:
        json.dump(asdict(config), f, indent=2)

    return final_path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Supervised fine-tuning")
    parser.add_argument("--dataset", required=True, help="Path to dataset")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--name", required=True, help="Adapter name")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--lora-r", type=int, default=16)

    args = parser.parse_args()

    config = TrainingConfig(
        dataset_path=args.dataset,
        dataset_type="supervised",
        output_dir=args.output,
        adapter_name=args.name,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        lora_r=args.lora_r,
    )

    train_supervised(config)
