"""Preference-based training (DPO) for MusicGen with LoRA."""

import json
import logging
import os
import sys
from dataclasses import asdict

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


class PreferenceDataset(Dataset):
    """Dataset for preference-based training (DPO)."""

    def __init__(
        self,
        data_path: str,
        sample_rate: int = 32000,
        max_duration: float = 10.0,
    ):
        self.sample_rate = sample_rate
        self.max_duration = max_duration
        self.max_length = int(max_duration * sample_rate)

        # Load dataset
        self.samples = []
        with open(data_path) as f:
            for line in f:
                sample = json.loads(line)
                self.samples.append(sample)

        logger.info(f"Loaded {len(self.samples)} preference pairs")
        sys.stdout.flush()

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

        return waveform  # Shape: [1, seq_len]

    def __getitem__(self, idx):
        sample = self.samples[idx]

        # Load chosen and rejected audio
        chosen_audio = self._load_audio(sample["chosen_path"])
        rejected_audio = self._load_audio(sample["rejected_path"])

        return {
            "prompt": sample["prompt"],
            "chosen_audio": chosen_audio,
            "rejected_audio": rejected_audio,
        }


def collate_fn(batch, processor):
    """Custom collate function to process batch with processor."""
    prompts = [item["prompt"] for item in batch]
    chosen_audios = [item["chosen_audio"] for item in batch]
    rejected_audios = [item["rejected_audio"] for item in batch]

    # Process text inputs
    text_inputs = processor(
        text=prompts,
        padding=True,
        return_tensors="pt",
    )

    # Stack audio tensors
    chosen_batch = torch.stack(chosen_audios, dim=0)
    rejected_batch = torch.stack(rejected_audios, dim=0)

    return {
        "input_ids": text_inputs["input_ids"],
        "attention_mask": text_inputs["attention_mask"],
        "chosen_audio": chosen_batch,
        "rejected_audio": rejected_batch,
    }


def dpo_loss(
    policy_chosen_logps: torch.Tensor,
    policy_rejected_logps: torch.Tensor,
    reference_chosen_logps: torch.Tensor,
    reference_rejected_logps: torch.Tensor,
    beta: float = 0.1,
) -> torch.Tensor:
    """Compute DPO loss."""
    pi_logratios = policy_chosen_logps - policy_rejected_logps
    ref_logratios = reference_chosen_logps - reference_rejected_logps

    logits = pi_logratios - ref_logratios
    losses = -torch.nn.functional.logsigmoid(beta * logits)

    return losses.mean()


def train_preference(config: TrainingConfig):
    """Run preference-based training (DPO)."""
    config.validate()

    logger.info("Loading model and processor...")
    sys.stdout.flush()

    processor = AutoProcessor.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )

    # Load reference model (frozen)
    reference_model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )
    reference_model.config.decoder_start_token_id = 2048
    reference_model.config.pad_token_id = 2048
    reference_model.decoder.config.decoder_start_token_id = 2048
    reference_model.decoder.config.pad_token_id = 2048
    reference_model.eval()
    for param in reference_model.parameters():
        param.requires_grad = False

    # Get the audio encoder for encoding waveforms to tokens
    audio_encoder = reference_model.audio_encoder

    # Load policy model with LoRA
    policy_model = MusicgenForConditionalGeneration.from_pretrained(
        config.base_model,
        cache_dir=config.model_cache_dir,
    )
    policy_model.config.decoder_start_token_id = 2048
    policy_model.config.pad_token_id = 2048
    policy_model.decoder.config.decoder_start_token_id = 2048
    policy_model.decoder.config.pad_token_id = 2048

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
    policy_model.decoder = get_peft_model(policy_model.decoder, lora_config)
    policy_model.decoder.print_trainable_parameters()
    sys.stdout.flush()

    # Move to device
    device = torch.device(config.device if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    sys.stdout.flush()

    reference_model = reference_model.to(device)
    policy_model = policy_model.to(device)

    # Create dataset and dataloader
    logger.info("Loading dataset...")
    sys.stdout.flush()

    train_dataset = PreferenceDataset(config.dataset_path)

    if len(train_dataset) == 0:
        raise ValueError(
            f"No training samples found in dataset at {config.dataset_path}. "
            "Make sure you have preference pairs."
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
        policy_model.decoder.parameters(),
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
    logger.info(f"Starting DPO training for {config.num_epochs} epochs...")
    logger.info(f"Total training steps: {num_training_steps}")
    sys.stdout.flush()

    os.makedirs(config.output_dir, exist_ok=True)

    global_step = 0
    best_loss = float("inf")
    patience_counter = 0
    bos_token_id = 2048

    for epoch in range(config.num_epochs):
        policy_model.train()
        epoch_loss = 0.0

        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}", file=sys.stdout)
        for batch_idx, batch in enumerate(progress_bar):
            # Move to device
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            chosen_audio = batch["chosen_audio"].to(device)
            rejected_audio = batch["rejected_audio"].to(device)

            # Encode audio to tokens
            with torch.no_grad():
                chosen_codes = audio_encoder.encode(chosen_audio).audio_codes
                rejected_codes = audio_encoder.encode(rejected_audio).audio_codes
                if chosen_codes.dim() == 4:
                    chosen_codes = chosen_codes.squeeze(0)
                if rejected_codes.dim() == 4:
                    rejected_codes = rejected_codes.squeeze(0)

            batch_size, num_codebooks, seq_len = chosen_codes.shape

            # Get text encoder outputs (same for both models, they share the same text encoder)
            text_encoder_outputs = policy_model.text_encoder(
                input_ids=input_ids,
                attention_mask=attention_mask,
            )
            encoder_hidden_states = policy_model.enc_to_dec_proj(
                text_encoder_outputs.last_hidden_state
            )

            # Prepare decoder inputs for chosen
            chosen_decoder_input = torch.full(
                (batch_size, num_codebooks, seq_len),
                bos_token_id,
                dtype=torch.long,
                device=device,
            )
            chosen_decoder_input[:, :, 1:] = chosen_codes[:, :, :-1]
            for k in range(1, num_codebooks):
                chosen_decoder_input[:, k, :k] = bos_token_id

            # Prepare decoder inputs for rejected
            rejected_decoder_input = torch.full(
                (batch_size, num_codebooks, seq_len),
                bos_token_id,
                dtype=torch.long,
                device=device,
            )
            rejected_decoder_input[:, :, 1:] = rejected_codes[:, :, :-1]
            for k in range(1, num_codebooks):
                rejected_decoder_input[:, k, :k] = bos_token_id

            # Get reference encoder hidden states
            with torch.no_grad():
                ref_text_outputs = reference_model.text_encoder(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                )
                ref_encoder_hidden_states = reference_model.enc_to_dec_proj(
                    ref_text_outputs.last_hidden_state
                )

            # Get reference model log probs (losses)
            with torch.no_grad():
                ref_chosen_outputs = reference_model.decoder(
                    input_ids=chosen_decoder_input,
                    encoder_hidden_states=ref_encoder_hidden_states,
                    encoder_attention_mask=attention_mask,
                    labels=chosen_codes,
                )
                ref_rejected_outputs = reference_model.decoder(
                    input_ids=rejected_decoder_input,
                    encoder_hidden_states=ref_encoder_hidden_states,
                    encoder_attention_mask=attention_mask,
                    labels=rejected_codes,
                )

            # Get policy model log probs (losses)
            policy_chosen_outputs = policy_model.decoder(
                input_ids=chosen_decoder_input,
                encoder_hidden_states=encoder_hidden_states,
                encoder_attention_mask=attention_mask,
                labels=chosen_codes,
            )
            policy_rejected_outputs = policy_model.decoder(
                input_ids=rejected_decoder_input,
                encoder_hidden_states=encoder_hidden_states,
                encoder_attention_mask=attention_mask,
                labels=rejected_codes,
            )

            # Compute DPO loss (negative loss = log prob)
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
                    policy_model.decoder.parameters(), config.max_grad_norm
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
                    policy_model.decoder.save_pretrained(checkpoint_path)
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
            policy_model.decoder.save_pretrained(best_path)
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
    policy_model.decoder.save_pretrained(final_path)
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
