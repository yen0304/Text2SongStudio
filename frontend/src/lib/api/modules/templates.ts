/**
 * Templates API Module
 * 
 * Handles all template-related API operations
 */

import { fetchApi } from '../client';
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, ListTemplatesParams } from '../types/templates';
import type { PaginatedResponse } from '../types/common';

export const templatesApi = {
  /**
   * Create a new user template
   */
  create: (data: CreateTemplateRequest) =>
    fetchApi<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a template by ID
   */
  get: (id: string) => 
    fetchApi<Template>(`/templates/${id}`),

  /**
   * List templates with optional filtering
   */
  list: (params: ListTemplatesParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.is_system !== undefined) searchParams.append('is_system', params.is_system.toString());
    
    const queryString = searchParams.toString();
    return fetchApi<PaginatedResponse<Template>>(`/templates${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Update a user template
   */
  update: (id: string, data: UpdateTemplateRequest) =>
    fetchApi<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a user template
   */
  delete: (id: string) =>
    fetchApi<void>(`/templates/${id}`, {
      method: 'DELETE',
    }),

  /**
   * List all template categories
   */
  listCategories: () =>
    fetchApi<string[]>('/templates/categories/list'),
};
