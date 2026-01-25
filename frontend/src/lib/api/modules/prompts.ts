/**
 * Prompts API Module
 * 
 * Handles all prompt-related API operations
 */

import { fetchApi } from '../client';
import type { Prompt, CreatePromptRequest } from '../types/prompts';
import type { PaginatedResponse } from '../types/common';

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
};
