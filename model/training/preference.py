"""Preference-based training (DPO) for MusicGen with LoRA."""

import json
import os
import logging
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


class PreferenceDataset(Dataset):
    """Dataset for preference-based training (DPO)."""

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
                self.samples.append(sample)

        logger.info(f"Loaded {len(self.samples)} preference pairs")

    def __len__(self):
        return len(self.samples)

    def _load_audio(self, audio_path: str) -> torch.Tensor:
        waveform, sr = torchaudio.load(audio_path)

        # Resample if needed
        if sr != self.sample_rate:
            resampler = torchaudio.transforms.Resample(sr, self.sample_rate)
            waveform = resampler(waveform)

        # Convert to mono
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Truncate or pad
        if waveform.shape[1] > self.max_length:
            waveform = waveform[:, : self.max_length]
        elif waveform.shape[1] < self.max_length:
            padding = self.max_length - waveform.shape[1]
            waveform = torch.nn.functional.pad(waveform, (0, padding))

        return waveform.squeeze(0)

    def __getitem__(self, idx):
        sample = self.samples[idx]

        # Process text
        text_inputs = self.processor(
            text=[sample["prompt"]],
            padding=True,
            return_tensors="pt",
        )

        # Load chosen and rejected audio
        chosen_audio = self._load_audio(sample["chosen_path"])
        rejected_audio = self._load_audio(sample["rejected_path"])

        return {
            "input_ids": text_inputs["input_ids"].squeeze(0),
            "attention_mask": text_inputs["attention_mask"].squeeze(0),
            "chosen_audio": chosen_audio,
            "rejected_audio": rejected_audio,
        }


def dpo_loss(
    policy_chosen_logps: torch.Tensor,
    policy_rejected_logps: torch.Tensor,
    reference_chosen_logps: torch.Tensor,
    reference_rejected_logps: torch.Tensor,
    beta: float = 0.1,
) -> torch.Tensor:
    """Compute DPO loss.

    Args:
        policy_chosen_logps: Log probs of chosen samples under policy
        policy_rejected_logps: Log probs of rejected samples under policy
        reference_chosen_logps: Log probs of chosen samples under reference
        reference_rejected_logps: Log probs of rejected samples under reference
        beta: Temperature parameter

    Returns:
        DPO loss
    """
    pi_logratios = policy_chosen_logps - policy_rejected_logps
    ref_logratios = reference_chosen_logps - reference_rejected_logps

    logits = pi_logratios - ref_logratios
    losses = -torch.nn.functional.logsigmoid(beta * logits)

    return losses.mean()


def train_preference(config: TrainingConfig):
    """Run preference-based training (DPO)."""
    config.validate()

    logger.info("Loading model and processor...")
    processor = AutoProcessor.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )

    # Load reference model (frozen)
    reference_model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )
    reference_model.eval()
    for param in reference_model.parameters():
        param.requires_grad = False

    # Load policy model with LoRA
    policy_model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )

    logger.info("Configuring LoRA...")
    lora_config = LoraConfig(
        r=config.lora_r,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        target_modules=config.lora_target_modules,
        task_type=TaskType.CAUSAL_LM,
    )
    policy_model = get_peft_model(policy_model, lora_config)
    policy_model.print_trainable_parameters()

    # Move to device
    device = torch.device(config.device if torch.cuda.is_available() else "cpu")
    reference_model = reference_model.to(device)
    policy_model = policy_model.to(device)

    # Create dataset and dataloader
    logger.info("Loading dataset...")
    train_dataset = PreferenceDataset(
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
        policy_model.parameters(),
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
    logger.info("Starting DPO training...")
    os.makedirs(config.output_dir, exist_ok=True)

    global_step = 0
    best_loss = float("inf")
    patience_counter = 0

    for epoch in range(config.num_epochs):
        policy_model.train()
        epoch_loss = 0.0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}")
        for batch_idx, batch in enumerate(progress_bar):
            # Move to device
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            chosen_audio = batch["chosen_audio"].to(device)
            rejected_audio = batch["rejected_audio"].to(device)

            # Get policy log probs
            with torch.no_grad():
                ref_chosen_outputs = reference_model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=chosen_audio,
                )
                ref_rejected_outputs = reference_model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=rejected_audio,
                )

            policy_chosen_outputs = policy_model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=chosen_audio,
            )
            policy_rejected_outputs = policy_model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=rejected_audio,
            )

            # Compute DPO loss
            loss = dpo_loss(
                policy_chosen_logps=-policy_chosen_outputs.loss,
                policy_rejected_logps=-policy_rejected_outputs.loss,
                reference_chosen_logps=-ref_chosen_outputs.loss,
                reference_rejected_logps=-ref_rejected_outputs.loss,
                beta=config.dpo_beta,
            )
            loss = loss / config.gradient_accumulation_steps

            # Backward pass
            loss.backward()

            if (batch_idx + 1) % config.gradient_accumulation_steps == 0:
                torch.nn.utils.clip_grad_norm_(
                    policy_model.parameters(), config.max_grad_norm
                )
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
                    policy_model.save_pretrained(checkpoint_path)
                    logger.info(f"Saved checkpoint to {checkpoint_path}")

            epoch_loss += loss.item() * config.gradient_accumulation_steps
            progress_bar.set_postfix(loss=loss.item() * config.gradient_accumulation_steps)

        avg_epoch_loss = epoch_loss / len(train_loader)
        logger.info(f"Epoch {epoch + 1} average loss: {avg_epoch_loss:.4f}")

        # Early stopping
        if avg_epoch_loss < best_loss - config.early_stopping_threshold:
            best_loss = avg_epoch_loss
            patience_counter = 0
            best_path = os.path.join(config.output_dir, "best")
            policy_model.save_pretrained(best_path)
            logger.info(f"New best model saved to {best_path}")
        else:
            patience_counter += 1
            if patience_counter >= config.early_stopping_patience:
                logger.info("Early stopping triggered")
                break

    # Save final model
    final_path = os.path.join(config.output_dir, "final")
    policy_model.save_pretrained(final_path)
    logger.info(f"Final model saved to {final_path}")

    # Save training config
    config_path = os.path.join(config.output_dir, "training_config.json")
    with open(config_path, "w") as f:
        json.dump(asdict(config), f, indent=2)

    return final_path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Preference-based training (DPO)")
    parser.add_argument("--dataset", required=True, help="Path to preference dataset")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--name", required=True, help="Adapter name")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--beta", type=float, default=0.1, help="DPO beta")

    args = parser.parse_args()

    config = TrainingConfig(
        dataset_path=args.dataset,
        dataset_type="preference",
        output_dir=args.output,
        adapter_name=args.name,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        lora_r=args.lora_r,
        dpo_beta=args.beta,
    )

    train_preference(config)
