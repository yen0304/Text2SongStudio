/**
 * Datasets API Module
 * 
 * Handles all dataset-related API operations
 */

import { fetchApi } from '../client';
import type { 
  Dataset, 
  DatasetCreate, 
  DatasetExport, 
  DatasetStats,
  FilterQuery 
} from '../types/datasets';
import type { PaginatedResponse } from '../types/common';

export const datasetsApi = {
  /**
   * List all datasets with pagination
   */
  list: (page = 1, limit = 20) =>
    fetchApi<PaginatedResponse<Dataset>>(`/datasets?page=${page}&limit=${limit}`),

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
