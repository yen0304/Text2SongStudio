/**
 * Model configuration types
 */

/**
 * Full model configuration as returned by the API
 */
export interface ModelConfig {
  /** Short identifier for the model */
  id: string;
  /** Human-readable model name */
  display_name: string;
  /** HuggingFace model identifier */
  hf_model_id: string;
  /** Maximum generation duration in seconds */
  max_duration_seconds: number;
  /** Recommended duration for optimal quality */
  recommended_duration_seconds: number;
  /** Minimum VRAM required in GB */
  vram_requirement_gb: number;
  /** Audio sample rate in Hz */
  sample_rate: number;
  /** Brief description of the model */
  description: string;
  /** Whether this is the currently loaded model */
  is_active: boolean;
}

/**
 * Minimal model config info embedded in other responses (e.g., adapters)
 */
export interface BaseModelConfigInfo {
  /** Short identifier for the model */
  id: string;
  /** Human-readable model name */
  display_name: string;
  /** Maximum generation duration in seconds */
  max_duration_seconds: number;
}

/**
 * Response for listing all available models
 */
export interface ModelsListResponse {
  /** List of available model configurations */
  models: ModelConfig[];
  /** ID of the currently active model */
  current_model: string;
}

/**
 * Request for switching to a different model
 */
export interface ModelSwitchRequest {
  /** ID of the model to switch to */
  model_id: string;
}

/**
 * Response from model switch operation
 */
export interface ModelSwitchResponse {
  /** Whether the switch was successful */
  success: boolean;
  /** ID of the previous model */
  previous_model: string;
  /** ID of the now-active model */
  current_model: string;
  /** Status message */
  message: string;
}

/**
 * Progress event from model switch streaming endpoint
 */
export interface ModelSwitchProgressEvent {
  /** Event type: 'status', 'progress', 'done', 'error', 'heartbeat' */
  event: 'status' | 'progress' | 'done' | 'error' | 'heartbeat';
  /** Human-readable status message */
  message: string;
  /** Current stage: 'unloading', 'downloading', 'loading', 'complete' */
  stage?: string;
  /** Name of the file being downloaded */
  file_name?: string;
  /** Download progress 0-100 (current file) */
  progress?: number;
  /** Overall download progress 0-100 (all files combined) */
  overall_progress?: number;
  /** Number of files completed */
  files_completed?: number;
  /** Total number of files to download */
  total_files?: number;
  /** Human-readable downloaded size */
  downloaded_size?: string;
  /** Human-readable total size */
  total_size?: string;
  /** Download speed */
  speed?: string;
  /** Previous model ID (on done event) */
  previous_model?: string;
  /** Current model ID (on done event) */
  current_model?: string;
  /** Indicates a single file download completed (not entire download) */
  file_complete?: boolean;
}
