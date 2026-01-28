/**
 * Hyperparameter tooltip explanations for training configuration
 */

export const HYPERPARAMETER_TOOLTIPS: Record<string, string> = {
  // Model
  base_model: 'The foundation model used for fine-tuning. MusicGen variants include small (300M), medium (1.5B), and large (3.3B).',
  dataset_type: "Training approach: 'supervised' uses rated samples for SFT, 'preference' uses comparison pairs for DPO.",
  
  // LoRA
  lora_r: 'LoRA rank - lower values (4-16) are more efficient, higher values (32-64) capture more complex adaptations.',
  lora_alpha: 'LoRA scaling factor. Common practice: alpha = 2 × rank. Higher values increase adaptation strength.',
  lora_dropout: 'Dropout rate for LoRA layers. Helps prevent overfitting. Typical values: 0.0-0.1.',
  lora_target_modules: 'Model layers to apply LoRA to. Usually attention layers (q_proj, v_proj, k_proj, out_proj).',
  
  // Training
  num_epochs: 'Number of complete passes through the training dataset. More epochs can improve results but risk overfitting.',
  batch_size: 'Samples processed per training step. Larger batches are more stable but require more memory.',
  learning_rate: 'Step size for parameter updates. Too high causes instability, too low causes slow convergence. Typical: 1e-4 to 1e-5.',
  gradient_accumulation_steps: 'Accumulate gradients over N steps before update. Simulates larger batch size with less memory.',
  warmup_steps: 'Steps to gradually increase learning rate at start. Helps stabilize early training.',
  weight_decay: 'L2 regularization strength. Helps prevent overfitting by penalizing large weights.',
  max_grad_norm: 'Clip gradients to prevent exploding gradients. Values 0.5-1.0 are common.',
  
  // DPO
  dpo_beta: 'DPO temperature parameter. Lower values (0.1-0.5) make preferences sharper.',
  
  // Hardware
  fp16: 'Use 16-bit floating point for faster training and lower memory usage.',
  device: 'Hardware device used for training (cuda for GPU, cpu for CPU).',
  
  // Checkpointing
  save_steps: 'Save checkpoint every N training steps.',
  save_total_limit: 'Maximum checkpoints to keep. Older ones are deleted.',
  eval_steps: 'Run evaluation every N steps.',
  early_stopping_patience: 'Stop if no improvement for N evaluations.',
  early_stopping_threshold: 'Minimum improvement required to reset patience counter.',
  
  // Results
  final_loss: 'The final training loss value when training completed. Lower is generally better.',
};

/**
 * Category groupings for hyperparameters
 */
export const HYPERPARAMETER_CATEGORIES = {
  model: ['base_model', 'dataset_type'],
  lora: ['lora_r', 'lora_alpha', 'lora_dropout', 'lora_target_modules'],
  training: ['num_epochs', 'batch_size', 'learning_rate', 'gradient_accumulation_steps', 'warmup_steps', 'weight_decay', 'max_grad_norm'],
  dpo: ['dpo_beta'],
  hardware: ['fp16', 'device'],
  checkpointing: ['save_steps', 'save_total_limit', 'eval_steps', 'early_stopping_patience', 'early_stopping_threshold'],
  results: ['final_loss'],
} as const;
