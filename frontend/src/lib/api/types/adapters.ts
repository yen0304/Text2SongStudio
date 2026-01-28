/**
 * Adapter-related types
 */

export interface Adapter {
  id: string;
  name: string;
  description: string | null;
  base_model: string;
  status: 'active' | 'archived';
  current_version: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AdapterVersion {
  id: string;
  adapter_id: string;
  version: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Training configuration stored after adapter training completes
 */
export interface TrainingConfig {
  // Model
  base_model?: string;
  dataset_type?: string;
  
  // LoRA
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  lora_target_modules?: string[];
  
  // Training
  num_epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  gradient_accumulation_steps?: number;
  warmup_steps?: number;
  weight_decay?: number;
  max_grad_norm?: number;
  
  // DPO
  dpo_beta?: number;
  
  // Hardware
  fp16?: boolean;
  device?: string;
  
  // Checkpointing
  save_steps?: number;
  save_total_limit?: number;
  eval_steps?: number;
  early_stopping_patience?: number;
  early_stopping_threshold?: number;
  
  // Results
  final_loss?: number;
}

export interface AdapterDetail extends Adapter {
  versions: AdapterVersion[];
  training_config: TrainingConfig | null;
}

export interface AdapterTimelineEvent {
  id: string;
  type: 'created' | 'version' | 'training';
  timestamp: string;
  title: string;
  description: string | null;
  metadata: {
    adapter_id?: string;
    version_id?: string;
    version?: string;
    is_active?: boolean;
    run_id?: string;
    status?: string;
    final_loss?: number | null;
  } | null;
}

export interface AdapterTimeline {
  adapter_id: string;
  adapter_name: string;
  events: AdapterTimelineEvent[];
  total_versions: number;
  total_training_runs: number;
}

export interface AdapterStats {
  total: number;
  active: number;
  archived: number;
  total_versions: number;
}

export interface CreateAdapterRequest {
  name: string;
  description?: string;
  base_model?: string;
  config?: Record<string, unknown>;
}

export interface UpdateAdapterRequest {
  name?: string;
  description?: string;
  status?: string;
  is_active?: boolean;
  config?: Record<string, unknown>;
}

export interface ListAdaptersParams {
  activeOnly?: boolean;
  status?: string;
  skip?: number;
  limit?: number;
}
