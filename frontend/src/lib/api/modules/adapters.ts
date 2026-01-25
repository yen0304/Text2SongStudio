/**
 * Adapters API Module
 * 
 * Handles all adapter-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  Adapter, 
  AdapterDetail, 
  AdapterTimeline,
  AdapterVersion,
  AdapterStats,
  CreateAdapterRequest,
  UpdateAdapterRequest,
  ListAdaptersParams
} from '../types/adapters';
import type { PaginatedResponse } from '../types/common';

export const adaptersApi = {
  /**
   * List all adapters with filters
   */
  list: (params?: ListAdaptersParams) => {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.set('active_only', 'true');
    if (params?.status) searchParams.set('status', params.status);
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<PaginatedResponse<Adapter>>(`/adapters${query ? `?${query}` : ''}`);
  },

  /**
   * Get adapter statistics
   */
  getStats: () => 
    fetchApi<AdapterStats>('/adapters/stats'),

  /**
   * Get a specific adapter with versions
   */
  get: (id: string) => 
    fetchApi<AdapterDetail>(`/adapters/${id}`),

  /**
   * Get adapter timeline (events history)
   */
  getTimeline: (id: string) => 
    fetchApi<AdapterTimeline>(`/adapters/${id}/timeline`),

  /**
   * Create a new adapter
   */
  create: (data: CreateAdapterRequest) =>
    fetchApi<Adapter>('/adapters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an adapter
   */
  update: (id: string, data: UpdateAdapterRequest) =>
    fetchApi<Adapter>(`/adapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an adapter
   */
  delete: (id: string) =>
    fetchApi<{ status: string; adapter_id: string }>(`/adapters/${id}`, { method: 'DELETE' }),

  /**
   * Create a new version for an adapter
   */
  createVersion: (adapterId: string, data: { version: string; description?: string }) =>
    fetchApi<AdapterVersion>(
      `/adapters/${adapterId}/versions?version=${encodeURIComponent(data.version)}${data.description ? `&description=${encodeURIComponent(data.description)}` : ''}`,
      { method: 'POST' }
    ),

  /**
   * Activate a specific adapter version
   */
  activateVersion: (adapterId: string, versionId: string) =>
    fetchApi<{ status: string; version: string }>(
      `/adapters/${adapterId}/versions/${versionId}/activate`,
      { method: 'PATCH' }
    ),
};
