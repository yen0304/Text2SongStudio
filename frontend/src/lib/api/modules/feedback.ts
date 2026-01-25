/**
 * Feedback API Module
 * 
 * Handles all feedback-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  Feedback, 
  FeedbackListResponse, 
  FeedbackStats,
  SubmitFeedbackRequest,
  ListFeedbackParams
} from '../types/feedback';

export const feedbackApi = {
  /**
   * Submit feedback for an audio sample
   */
  submit: (data: SubmitFeedbackRequest) =>
    fetchApi<Feedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get feedback for a specific audio (legacy)
   */
  get: (audioId?: string) =>
    fetchApi<Feedback[]>(`/feedback${audioId ? `?audio_id=${audioId}` : ''}`),

  /**
   * List feedback with filters
   */
  list: (params?: ListFeedbackParams) => {
    const searchParams = new URLSearchParams();
    if (params?.audio_id) searchParams.set('audio_id', params.audio_id);
    if (params?.job_id) searchParams.set('job_id', params.job_id);
    if (params?.min_rating) searchParams.set('min_rating', params.min_rating.toString());
    if (params?.max_rating) searchParams.set('max_rating', params.max_rating.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<FeedbackListResponse>(`/feedback${query ? `?${query}` : ''}`);
  },

  /**
   * Delete feedback
   */
  delete: (feedbackId: string) =>
    fetchApi<{ status: string; feedback_id: string }>(`/feedback/${feedbackId}`, { method: 'DELETE' }),

  /**
   * Get feedback statistics summary
   */
  getStats: () => 
    fetchApi<FeedbackStats>('/feedback/summary'),
};
