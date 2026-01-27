/**
 * Preferences API Module
 * 
 * Handles preference pair operations for DPO/RLHF training data.
 */

import { fetchApi } from '../client';
import type {
  PreferencePair,
  PreferencePairWithDetails,
  CreatePreferenceRequest,
  PreferenceListResponse,
  PreferenceStats,
  ListPreferencesParams,
} from '../types/preferences';

export const preferencesApi = {
  /**
   * Submit a preference pair (chosen vs rejected audio)
   */
  submit: (data: CreatePreferenceRequest) =>
    fetchApi<PreferencePair>('/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a specific preference by ID
   */
  get: (preferenceId: string) =>
    fetchApi<PreferencePairWithDetails>(`/preferences/${preferenceId}`),

  /**
   * List preferences with optional filters
   */
  list: (params?: ListPreferencesParams) => {
    const searchParams = new URLSearchParams();
    if (params?.prompt_id) searchParams.set('prompt_id', params.prompt_id);
    if (params?.audio_id) searchParams.set('audio_id', params.audio_id);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<PreferenceListResponse>(`/preferences${query ? `?${query}` : ''}`);
  },

  /**
   * Get preferences for a specific prompt
   */
  getForPrompt: (promptId: string) =>
    fetchApi<PreferenceListResponse>(`/preferences/prompt/${promptId}`),

  /**
   * Delete a preference
   */
  delete: (preferenceId: string) =>
    fetchApi<{ status: string; id: string }>(`/preferences/${preferenceId}`, { method: 'DELETE' }),

  /**
   * Get preference statistics
   */
  getStats: () =>
    fetchApi<PreferenceStats>('/preferences/summary'),
};
