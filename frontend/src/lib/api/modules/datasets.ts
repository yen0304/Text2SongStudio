/**
 * Datasets API Module
 * 
 * Handles all dataset-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  Dataset, 
  DatasetCreate, 
  DatasetExport, 
  DatasetStats,
  FilterQuery 
} from '../types/datasets';
import type { PaginatedResponse } from '../types/common';

export interface ListDatasetsParams {
  page?: number;
  limit?: number;
  include_deleted?: boolean;
}

export const datasetsApi = {
  /**
   * List all datasets with pagination
   */
  list: (params?: ListDatasetsParams) => {
    const query = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      include_deleted: params?.include_deleted,
    });
    return fetchApi<PaginatedResponse<Dataset>>(`/datasets${query}`);
  },

  /**
   * Get a specific dataset
   */
  get: (id: string) => 
    fetchApi<Dataset>(`/datasets/${id}`),

  /**
   * Create a new dataset
   */
  create: (data: DatasetCreate) =>
    fetchApi<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a dataset (soft delete)
   */
  delete: (id: string) =>
    fetchApi<void>(`/datasets/${id}`, { method: 'DELETE' }),

  /**
   * Export a dataset
   */
  export: (id: string, format: 'jsonl' | 'huggingface' = 'jsonl', outputPath?: string) =>
    fetchApi<DatasetExport>(`/datasets/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ format, output_path: outputPath }),
    }),

  /**
   * Get dataset statistics
   */
  getStats: (id: string) => 
    fetchApi<DatasetStats>(`/datasets/${id}/stats`),

  /**
   * Preview count of samples for a dataset filter
   */
  previewCount: (type: 'supervised' | 'preference', filterQuery?: FilterQuery) =>
    fetchApi<{ count: number }>('/datasets/preview', {
      method: 'POST',
      body: JSON.stringify({ type, filter_query: filterQuery }),
    }),
};
