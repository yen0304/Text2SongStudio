/**
 * Default training configuration values
 * These match the defaults in backend/model/training/config.py
 */

export const DEFAULT_TRAINING_CONFIG = {
  // Training basics
  num_epochs: 3,
  batch_size: 2,
  learning_rate: 1e-4,
  gradient_accumulation_steps: 4,
  warmup_steps: 100,
  weight_decay: 0.01,
  max_grad_norm: 1.0,

  // LoRA
  lora_r: 16,
  lora_alpha: 32,
  lora_dropout: 0.05,

  // DPO
  dpo_beta: 0.1,

  // Hardware
  fp16: true,

  // Checkpointing
  save_steps: 500,
  save_total_limit: 3,
  eval_steps: 100,
  early_stopping_patience: 3,
  early_stopping_threshold: 0.01,
} as const;

/**
 * Essential parameters shown in compact mode
 */
export const ESSENTIAL_CONFIG_FIELDS = [
  'num_epochs',
  'batch_size', 
  'learning_rate',
  'lora_r',
  'lora_alpha',
] as const;

export type TrainingConfigKey = keyof typeof DEFAULT_TRAINING_CONFIG;

/**
 * Preset configurations for different training strategies
 */
export const CONFIG_PRESETS = {
  conservative: {
    name: 'Conservative',
    description: 'Stable training with smaller learning rate and more epochs',
    config: {
      num_epochs: 5,
      batch_size: 2,
      learning_rate: 5e-5,
      gradient_accumulation_steps: 8,
      warmup_steps: 200,
      weight_decay: 0.01,
      max_grad_norm: 0.5,
      lora_r: 8,
      lora_alpha: 16,
      lora_dropout: 0.1,
      fp16: true,
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Recommended settings for most use cases',
    config: {
      num_epochs: 3,
      batch_size: 2,
      learning_rate: 1e-4,
      gradient_accumulation_steps: 4,
      warmup_steps: 100,
      weight_decay: 0.01,
      max_grad_norm: 1.0,
      lora_r: 16,
      lora_alpha: 32,
      lora_dropout: 0.05,
      fp16: true,
    },
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Fast training with higher learning rate, fewer epochs',
    config: {
      num_epochs: 2,
      batch_size: 4,
      learning_rate: 2e-4,
      gradient_accumulation_steps: 2,
      warmup_steps: 50,
      weight_decay: 0.005,
      max_grad_norm: 1.5,
      lora_r: 32,
      lora_alpha: 64,
      lora_dropout: 0.03,
      fp16: true,
    },
  },
} as const;

export type PresetKey = keyof typeof CONFIG_PRESETS;
