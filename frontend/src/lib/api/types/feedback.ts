/**
 * Feedback-related types
 */

export interface Feedback {
  id: string;
  audio_id: string;
  rating?: number;
  rating_criterion?: string;
  preferred_over?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
}

export interface SampleFeedbackItem {
  id: string;
  rating: number | null;
  rating_criterion: string | null;
  preferred_over: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
}

export interface SampleFeedbackGroup {
  audio_id: string;
  label: string;
  feedback: SampleFeedbackItem[];
  average_rating: number | null;
  feedback_count: number;
}

export interface JobFeedbackResponse {
  job_id: string;
  prompt_id: string;
  total_samples: number;
  total_feedback: number;
  average_rating: number | null;
  samples: SampleFeedbackGroup[];
}

export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
}

export interface FeedbackStats {
  total_feedback: number;
  total_ratings: number;
  total_preferences: number;
  rating_distribution: Record<number, number>;
  high_rated_samples: number;
}

export interface SubmitFeedbackRequest {
  audio_id: string;
  rating?: number;
  preferred_over?: string;
  tags?: string[];
  notes?: string;
}

export interface ListFeedbackParams {
  audio_id?: string;
  job_id?: string;
  min_rating?: number;
  max_rating?: number;
  page?: number;
  limit?: number;
}
