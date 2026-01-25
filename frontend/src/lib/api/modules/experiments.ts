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
  CreateRunRequest
} from '../types/experiments';
import type { PaginatedResponse } from '../types/common';

export interface ListExperimentsParams {
  status?: string;
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
   * Delete an experiment
   */
  delete: (id: string) =>
    fetchApi<void>(`/experiments/${id}`, { method: 'DELETE' }),

  /**
   * Create a new run for an experiment
   */
  createRun: (experimentId: string, data?: CreateRunRequest) =>
    fetchApi<ExperimentRun>(`/experiments/${experimentId}/runs`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  /**
   * Get experiment metrics summary
   */
  getMetrics: (experimentId: string) =>
    fetchApi<ExperimentMetrics>(`/experiments/${experimentId}/metrics`),
};
