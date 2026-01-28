/**
 * Experiments API Module
 * 
 * Handles all experiment-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  Experiment, 
  ExperimentDetail, 
  ExperimentRun,
  ExperimentMetrics,
  CreateExperimentRequest,
  UpdateExperimentRequest,
  CreateRunRequest,
  RunMetricsResponse,
  GetRunMetricsParams
} from '../types/experiments';
import type { PaginatedResponse } from '../types/common';

export interface ListExperimentsParams {
  status?: string;
  include_archived?: boolean;
  limit?: number;
  offset?: number;
}

export const experimentsApi = {
  /**
   * List all experiments with filters
   */
  list: (params?: ListExperimentsParams) => {
    const query = buildQueryString({
      status: params?.status,
      include_archived: params?.include_archived,
      limit: params?.limit,
      offset: params?.offset,
    });
    return fetchApi<PaginatedResponse<Experiment> & { limit: number; offset: number }>(`/experiments${query}`);
  },

  /**
   * Get a specific experiment with runs
   */
  get: (id: string) => 
    fetchApi<ExperimentDetail>(`/experiments/${id}`),

  /**
   * Create a new experiment
   */
  create: (data: CreateExperimentRequest) =>
    fetchApi<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an experiment
   */
  update: (id: string, data: UpdateExperimentRequest) =>
    fetchApi<Experiment>(`/experiments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an experiment (archives it)
   */
  delete: (id: string) =>
    fetchApi<void>(`/experiments/${id}`, { method: 'DELETE' }),

  /**
   * Archive an experiment
   */
  archive: (id: string) =>
    fetchApi<Experiment>(`/experiments/${id}/archive`, { method: 'POST' }),

  /**
   * Unarchive an experiment
   */
  unarchive: (id: string) =>
    fetchApi<Experiment>(`/experiments/${id}/unarchive`, { method: 'POST' }),

  /**
   * Create a new run for an experiment
   */
  createRun: (experimentId: string, data?: CreateRunRequest) =>
    fetchApi<ExperimentRun>(`/experiments/${experimentId}/runs`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  /**
   * Delete a run from an experiment
   * Only runs in terminal states (failed, completed, cancelled) can be deleted
   */
  deleteRun: (experimentId: string, runId: string) =>
    fetchApi<void>(`/experiments/${experimentId}/runs/${runId}`, { method: 'DELETE' }),

  /**
   * Delete multiple runs at once
   * Only runs in terminal states (failed, completed, cancelled) can be deleted
   */
  deleteRunsBatch: (experimentId: string, runIds: string[]) =>
    fetchApi<{ deleted: number }>(`/experiments/${experimentId}/runs?${runIds.map(id => `run_ids=${id}`).join('&')}`, { 
      method: 'DELETE',
    }),

  /**
   * Get experiment metrics summary
   */
  getMetrics: (experimentId: string) =>
    fetchApi<ExperimentMetrics>(`/experiments/${experimentId}/metrics`),

  /**
   * Get time-series metrics for a specific run
   * Returns metrics for visualization (loss, learning_rate, grad_norm, etc.)
   */
  getRunMetrics: (experimentId: string, runId: string, params?: GetRunMetricsParams) => {
    const query = buildQueryString({
      metric_type: params?.metric_type,
      min_step: params?.min_step,
      max_step: params?.max_step,
    });
    return fetchApi<RunMetricsResponse>(`/experiments/${experimentId}/runs/${runId}/metrics${query}`);
  },
};
