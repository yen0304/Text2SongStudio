/**
 * Tags API Module
 * 
 * Handles audio tagging operations for filtering and categorization.
 */

import { fetchApi } from '../client';
import type {
  AudioTag,
  CreateTagRequest,
  BulkCreateTagsRequest,
  TagListResponse,
  TagStats,
  AvailableTagsResponse,
  ListTagsParams,
} from '../types/tags';

export const tagsApi = {
  /**
   * Add a single tag to an audio sample
   */
  add: (data: CreateTagRequest) =>
    fetchApi<AudioTag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Add multiple tags to an audio sample at once
   */
  addBulk: (data: BulkCreateTagsRequest) =>
    fetchApi<AudioTag[]>('/tags/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a specific tag by ID
   */
  get: (tagId: string) =>
    fetchApi<AudioTag>(`/tags/${tagId}`),

  /**
   * List tags with optional filters
   */
  list: (params?: ListTagsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.audio_id) searchParams.set('audio_id', params.audio_id);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.is_positive !== undefined) searchParams.set('is_positive', params.is_positive.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<TagListResponse>(`/tags${query ? `?${query}` : ''}`);
  },

  /**
   * Get tags for a specific audio sample
   */
  getForAudio: (audioId: string) =>
    fetchApi<TagListResponse>(`/tags/audio/${audioId}`),

  /**
   * Replace all tags for an audio sample
   */
  replaceForAudio: (audioId: string, data: { positive_tags: string[]; negative_tags: string[] }) =>
    fetchApi<AudioTag[]>(`/tags/audio/${audioId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a tag
   */
  delete: (tagId: string) =>
    fetchApi<{ status: string; id: string }>(`/tags/${tagId}`, { method: 'DELETE' }),

  /**
   * Get tag statistics
   */
  getStats: () =>
    fetchApi<TagStats>('/tags/summary'),

  /**
   * Get list of available/suggested tags
   */
  getAvailable: () =>
    fetchApi<AvailableTagsResponse>('/tags/available'),
};
