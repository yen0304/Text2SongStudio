/**
 * Ratings API Module
 * 
 * Handles quality rating operations for SFT training data.
 */

import { fetchApi } from '../client';
import type {
  QualityRating,
  CreateRatingRequest,
  RatingListResponse,
  RatingStats,
  ListRatingsParams,
} from '../types/ratings';

export const ratingsApi = {
  /**
   * Submit a quality rating for an audio sample
   */
  submit: (data: CreateRatingRequest) =>
    fetchApi<QualityRating>('/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a specific rating by ID
   */
  get: (ratingId: string) =>
    fetchApi<QualityRating>(`/ratings/${ratingId}`),

  /**
   * List ratings with optional filters
   */
  list: (params?: ListRatingsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.audio_id) searchParams.set('audio_id', params.audio_id);
    if (params?.criterion) searchParams.set('criterion', params.criterion);
    if (params?.min_rating !== undefined) searchParams.set('min_rating', params.min_rating.toString());
    if (params?.max_rating !== undefined) searchParams.set('max_rating', params.max_rating.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<RatingListResponse>(`/ratings${query ? `?${query}` : ''}`);
  },

  /**
   * Get ratings for a specific audio sample
   */
  getForAudio: (audioId: string) =>
    fetchApi<RatingListResponse>(`/ratings/audio/${audioId}`),

  /**
   * Delete a rating
   */
  delete: (ratingId: string) =>
    fetchApi<{ status: string; id: string }>(`/ratings/${ratingId}`, { method: 'DELETE' }),

  /**
   * Get rating statistics
   */
  getStats: (audioId?: string) => {
    const query = audioId ? `?audio_id=${audioId}` : '';
    return fetchApi<RatingStats>(`/ratings/summary${query}`);
  },
};
