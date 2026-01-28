/**
 * Experiment-related types
 */

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  dataset_id: string | null;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'archived';
  config: Record<string, unknown> | null;
  best_run_id: string | null;
  best_loss: number | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExperimentRun {
  id: string;
  experiment_id: string;
  adapter_id: string | null;
  name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  final_loss: number | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExperimentDetail extends Experiment {
  runs: ExperimentRun[];
}

export interface ExperimentMetrics {
  experiment_id: string;
  run_count: number;
  runs: {
    id: string;
    name: string;
    final_loss: number | null;
    metrics: Record<string, unknown>;
    adapter_id: string | null;
  }[];
  best_loss: number | null;
  best_run_id: string | null;
}

export interface CreateExperimentRequest {
  name: string;
  description?: string;
  dataset_id?: string;
  config?: Record<string, unknown>;
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  dataset_id?: string | null;
  config?: Record<string, unknown>;
}

export interface CreateRunRequest {
  name?: string;
  config?: Record<string, unknown>;
}

/**
 * A single metric data point in the time-series
 */
export interface MetricDataPoint {
  step: number;
  value: number;
  timestamp: string;
}

/**
 * Response from the run metrics endpoint
 */
export interface RunMetricsResponse {
  run_id: string;
  metrics: {
    loss?: MetricDataPoint[];
    learning_rate?: MetricDataPoint[];
    grad_norm?: MetricDataPoint[];
    epoch?: MetricDataPoint[];
    rewards_chosen?: MetricDataPoint[];
    rewards_rejected?: MetricDataPoint[];
    [key: string]: MetricDataPoint[] | undefined;
  };
  metadata: {
    last_updated: string | null;
    is_complete: boolean;
    status: string;
  };
}

/**
 * Parameters for the run metrics endpoint
 */
export interface GetRunMetricsParams {
  metric_type?: string;
  min_step?: number;
  max_step?: number;
}
