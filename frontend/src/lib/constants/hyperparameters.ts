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
  lora_target_modules: 'Model layers to apply LoRA to. Select attention and feedforward layers based on your needs.',
  
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
  early_stopping_enabled: 'Enable early stopping to halt training when loss stops improving. When disabled, training runs for all epochs and selects the best checkpoint.',
  early_stopping_patience: 'Stop if no improvement for N evaluations.',
  early_stopping_threshold: 'Minimum improvement required to reset patience counter.',
  
  // Results
  final_loss: 'The final training loss value when training completed. Lower is generally better.',
};

/**
 * LoRA Target Module descriptions and suggestions
 */
export interface TargetModuleInfo {
  name: string;
  description: string;
  suggestion: string;
  category: 'attention' | 'feedforward';
  recommended: boolean;
}

export const LORA_TARGET_MODULES: Record<string, TargetModuleInfo> = {
  q_proj: {
    name: 'Query Projection',
    description: 'Projects input to query vectors in self-attention. Controls what the model "looks for" in the input.',
    suggestion: 'Highly recommended. Essential for adapting attention patterns to your audio style.',
    category: 'attention',
    recommended: true,
  },
  k_proj: {
    name: 'Key Projection',
    description: 'Projects input to key vectors in self-attention. Determines what features are available to match against.',
    suggestion: 'Highly recommended. Works with Q to reshape how the model attends to different parts of input.',
    category: 'attention',
    recommended: true,
  },
  v_proj: {
    name: 'Value Projection',
    description: 'Projects input to value vectors in self-attention. Controls what information is extracted and passed forward.',
    suggestion: 'Highly recommended. Critical for changing the actual content the model generates.',
    category: 'attention',
    recommended: true,
  },
  out_proj: {
    name: 'Output Projection',
    description: 'Projects attention output back to model dimension. Combines attended information.',
    suggestion: 'Recommended. Helps refine how attention results are combined. Good for style transfer.',
    category: 'attention',
    recommended: true,
  },
  fc1: {
    name: 'Feed-Forward Layer 1',
    description: 'First layer of the FFN block. Expands representation to higher dimension for non-linear processing.',
    suggestion: 'Optional. Add if attention-only training is insufficient. Increases trainable parameters.',
    category: 'feedforward',
    recommended: false,
  },
  fc2: {
    name: 'Feed-Forward Layer 2',
    description: 'Second layer of the FFN block. Projects back to model dimension after non-linear activation.',
    suggestion: 'Optional. Usually paired with fc1. Use for more aggressive style changes.',
    category: 'feedforward',
    recommended: false,
  },
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
  checkpointing: ['save_steps', 'save_total_limit', 'eval_steps', 'early_stopping_enabled', 'early_stopping_patience', 'early_stopping_threshold'],
  results: ['final_loss'],
} as const;
