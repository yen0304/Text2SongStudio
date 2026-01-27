/**
 * Quality Rating types for SFT training data
 */

export type RatingCriterion = 'overall' | 'melody' | 'rhythm' | 'harmony' | 'coherence' | 'creativity' | 'adherence';

export interface QualityRating {
  id: string;
  audio_id: string;
  user_id: string | null;
  rating: number;
  criterion: RatingCriterion;
  notes: string | null;
  created_at: string;
}

export interface CreateRatingRequest {
  audio_id: string;
  rating: number;  // 1-5
  criterion?: RatingCriterion;
  notes?: string;
}

export interface RatingListResponse {
  items: QualityRating[];
  total: number;
}

export interface RatingStats {
  audio_id: string | null;
  total_ratings: number;
  average_rating: number | null;
  rating_by_criterion: Record<RatingCriterion, number>;
  rating_distribution: Record<number, number>;  // rating (1-5) -> count
}

export interface ListRatingsParams {
  audio_id?: string;
  criterion?: RatingCriterion;
  min_rating?: number;
  max_rating?: number;
  page?: number;
  limit?: number;
}
