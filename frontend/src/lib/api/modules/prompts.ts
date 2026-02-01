/**
 * Prompts API Module
 * 
 * Handles all prompt-related API operations
 */

import { fetchApi } from '../client';
import type { Prompt, CreatePromptRequest } from '../types/prompts';
import type { PaginatedResponse } from '../types/common';

export interface SearchPromptsParams {
  q?: string;
  style?: string;
  mood?: string;
  tempo_min?: number;
  tempo_max?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface SearchPromptsResponse extends PaginatedResponse<Prompt> {
  query: string | null;
}

export const promptsApi = {
  /**
   * Create a new prompt
   */
  create: (data: CreatePromptRequest) =>
    fetchApi<Prompt>('/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a prompt by ID
   */
  get: (id: string) => 
    fetchApi<Prompt>(`/prompts/${id}`),

  /**
   * List prompts with pagination
   */
  list: (page = 1, limit = 20) =>
    fetchApi<PaginatedResponse<Prompt>>(`/prompts?page=${page}&limit=${limit}`),

  /**
   * Search prompts with full-text search and attribute filters
   */
  search: (params: SearchPromptsParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.style) searchParams.append('style', params.style);
    if (params.mood) searchParams.append('mood', params.mood);
    if (params.tempo_min !== undefined) searchParams.append('tempo_min', params.tempo_min.toString());
    if (params.tempo_max !== undefined) searchParams.append('tempo_max', params.tempo_max.toString());
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return fetchApi<SearchPromptsResponse>(`/prompts/search${queryString ? `?${queryString}` : ''}`);
  },
};
