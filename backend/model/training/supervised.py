"""Supervised fine-tuning script for MusicGen with LoRA."""

import json
import logging
import os
import sys
from dataclasses import asdict
from pathlib import Path

import torch
import torchaudio
from peft import LoraConfig, TaskType, get_peft_model
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm
from transformers import AutoProcessor, MusicgenForConditionalGeneration

from model.training.config import TrainingConfig

# Force unbuffered output for real-time logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


class SupervisedDataset(Dataset):
    """Dataset for supervised fine-tuning."""

    def __init__(
        self,
        data_path: str,
        sample_rate: int = 32000,
        max_duration: float = 10.0,
    ):
        self.sample_rate = sample_rate
        self.max_duration = max_duration
        self.max_length = int(max_duration * sample_rate)

        # Handle both file and directory paths
        data_path = Path(data_path)
        if data_path.is_dir():
            data_file = data_path / "train.jsonl"
            if not data_file.exists():
                raise FileNotFoundError(f"train.jsonl not found in {data_path}")
        else:
            data_file = data_path

        self.samples = []
        with open(data_file) as f:
            for line in f:
                sample = json.loads(line)
                self.samples.append(sample)

        logger.info(f"Loaded {len(self.samples)} samples from {data_file}")
        sys.stdout.flush()

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

        return {
            "prompt": sample["prompt"],
            "audio": waveform,  # Shape: [1, seq_len]
        }


def collate_fn(batch, processor):
    """Custom collate function to process batch with processor."""
    prompts = [item["prompt"] for item in batch]
    audios = [item["audio"] for item in batch]

    # Process text inputs
    text_inputs = processor(
        text=prompts,
        padding=True,
        return_tensors="pt",
    )

    # Stack audio tensors - shape: [batch, 1, seq_len]
    audio_batch = torch.stack(audios, dim=0)

    return {
        "input_ids": text_inputs["input_ids"],
        "attention_mask": text_inputs["attention_mask"],
        "audio": audio_batch,
    }


def train_supervised(config: TrainingConfig):
    """Run supervised fine-tuning."""
    config.validate()

    logger.info("Loading model and processor...")
    sys.stdout.flush()

    processor = AutoProcessor.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )
    model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )

    # Set required config values for training
    model.config.decoder_start_token_id = 2048
    model.config.pad_token_id = 2048
    model.decoder.config.decoder_start_token_id = 2048
    model.decoder.config.pad_token_id = 2048

    # Get the audio encoder for encoding waveforms to tokens
    audio_encoder = model.audio_encoder

    # Configure LoRA on the decoder (the part that generates audio from text)
    logger.info("Configuring LoRA...")
    sys.stdout.flush()

    # Target modules for MusicGen decoder
    target_modules = ["q_proj", "v_proj", "k_proj", "out_proj", "fc1", "fc2"]

    lora_config = LoraConfig(
        r=config.lora_r,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        target_modules=target_modules,
        task_type=TaskType.CAUSAL_LM,
    )

    # Apply LoRA to the decoder only
    model.decoder = get_peft_model(model.decoder, lora_config)
    model.decoder.print_trainable_parameters()
    sys.stdout.flush()

    # Move to device
    device = torch.device(config.device if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    sys.stdout.flush()

    model = model.to(device)

    # Create dataset and dataloader
    logger.info("Loading dataset...")
    sys.stdout.flush()

    train_dataset = SupervisedDataset(
        config.dataset_path,
    )

    if len(train_dataset) == 0:
        raise ValueError(
            f"No training samples found in dataset at {config.dataset_path}. "
            "Make sure you have audio samples with ratings >= 4."
        )

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=0,
        collate_fn=lambda batch: collate_fn(batch, processor),
    )

    # Optimizer - only train LoRA parameters
    optimizer = torch.optim.AdamW(
        model.decoder.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )

    # Learning rate scheduler
    num_training_steps = len(train_loader) * config.num_epochs
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=max(num_training_steps, 1),
    )

    # Training loop
    logger.info(f"Starting training for {config.num_epochs} epochs...")
    logger.info(f"Total training steps: {num_training_steps}")
    sys.stdout.flush()

    os.makedirs(config.output_dir, exist_ok=True)

    global_step = 0
    best_loss = float("inf")
    patience_counter = 0
    bos_token_id = 2048

    for epoch in range(config.num_epochs):
        model.train()
        epoch_loss = 0.0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}", file=sys.stdout)
        for batch_idx, batch in enumerate(progress_bar):
            # Move to device
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            audio = batch["audio"].to(device)  # Shape: [batch, 1, seq_len]

            # Encode audio to tokens using the audio encoder (EnCodec)
            with torch.no_grad():
                encoder_outputs = audio_encoder.encode(audio)
                audio_codes = encoder_outputs.audio_codes
                # Shape: [1, batch, num_codebooks, frames] -> [batch, num_codebooks, frames]
                if audio_codes.dim() == 4:
                    audio_codes = audio_codes.squeeze(0)

            batch_size, num_codebooks, seq_len = audio_codes.shape

            # Get text encoder outputs and project to decoder hidden size
            text_encoder_outputs = model.text_encoder(
                input_ids=input_ids,
                attention_mask=attention_mask,
            )
            encoder_hidden_states = model.enc_to_dec_proj(
                text_encoder_outputs.last_hidden_state
            )

            # Prepare decoder inputs (shifted right)
            decoder_input_ids = torch.full(
                (batch_size, num_codebooks, seq_len),
                bos_token_id,
                dtype=torch.long,
                device=device,
            )
            decoder_input_ids[:, :, 1:] = audio_codes[:, :, :-1]

            # Apply delay pattern for multi-codebook generation
            for k in range(1, num_codebooks):
                decoder_input_ids[:, k, :k] = bos_token_id

            # Forward pass through decoder with labels
            outputs = model.decoder(
                input_ids=decoder_input_ids,
                encoder_hidden_states=encoder_hidden_states,
                encoder_attention_mask=attention_mask,
                labels=audio_codes,
            )

            loss = outputs.loss / config.gradient_accumulation_steps

            # Backward pass
            loss.backward()

            if (batch_idx + 1) % config.gradient_accumulation_steps == 0:
                torch.nn.utils.clip_grad_norm_(
                    model.decoder.parameters(), config.max_grad_norm
                )
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

                # Logging
                if global_step % config.logging_steps == 0:
                    current_loss = loss.item() * config.gradient_accumulation_steps
                    logger.info(
                        f"Step {global_step}: loss={current_loss:.4f}, "
                        f"lr={scheduler.get_last_lr()[0]:.2e}"
                    )
                    sys.stdout.flush()

                # Save checkpoint
                if global_step % config.save_steps == 0:
                    checkpoint_path = os.path.join(
                        config.output_dir, f"checkpoint-{global_step}"
                    )
                    model.decoder.save_pretrained(checkpoint_path)
                    logger.info(f"Saved checkpoint to {checkpoint_path}")
                    sys.stdout.flush()

            epoch_loss += loss.item() * config.gradient_accumulation_steps
            progress_bar.set_postfix(
                loss=loss.item() * config.gradient_accumulation_steps
            )

        avg_epoch_loss = epoch_loss / len(train_loader)
        logger.info(f"Epoch {epoch + 1} average loss: {avg_epoch_loss:.4f}")
        sys.stdout.flush()

        # Early stopping
        if avg_epoch_loss < best_loss - config.early_stopping_threshold:
            best_loss = avg_epoch_loss
            patience_counter = 0
            best_path = os.path.join(config.output_dir, "best")
            model.decoder.save_pretrained(best_path)
            logger.info(f"New best model saved to {best_path}")
            sys.stdout.flush()
        else:
            patience_counter += 1
            if patience_counter >= config.early_stopping_patience:
                logger.info("Early stopping triggered")
                sys.stdout.flush()
                break

    # Save final model
    final_path = os.path.join(config.output_dir, "final")
    model.decoder.save_pretrained(final_path)
    logger.info(f"Final model saved to {final_path}")
    sys.stdout.flush()

    # Save training config with final loss
    config_dict = asdict(config)
    config_dict["final_loss"] = best_loss
    config_path = os.path.join(config.output_dir, "training_config.json")
    with open(config_path, "w") as f:
        json.dump(config_dict, f, indent=2)

    logger.info("Training complete!")
    sys.stdout.flush()

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
