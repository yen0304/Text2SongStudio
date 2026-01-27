/**
 * Audio Tag types for filtering and categorization
 */

// Predefined positive tags
export const POSITIVE_TAGS = [
  'good_melody',
  'good_rhythm', 
  'good_harmony',
  'creative',
  'unique',
  'catchy',
  'professional',
  'polished',
  'emotional',
  'energetic',
] as const;

// Predefined negative tags
export const NEGATIVE_TAGS = [
  'bad',
  'noisy',
  'distorted',
  'off_key',
  'off_beat',
  'boring',
  'repetitive',
  'muddy',
  'harsh',
  'amateur',
] as const;

export type PositiveTag = (typeof POSITIVE_TAGS)[number];
export type NegativeTag = (typeof NEGATIVE_TAGS)[number];
export type PredefinedTag = PositiveTag | NegativeTag;

export interface AudioTag {
  id: string;
  audio_id: string;
  user_id: string | null;
  tag: string;
  is_positive: boolean;
  created_at: string;
}

export interface CreateTagRequest {
  audio_id: string;
  tag: string;
  is_positive?: boolean;
}

export interface BulkCreateTagsRequest {
  audio_id: string;
  positive_tags: string[];
  negative_tags: string[];
}

export interface TagListResponse {
  items: AudioTag[];
  total: number;
}

export interface TagStats {
  total_tags: number;
  positive_count: number;
  negative_count: number;
  tag_frequency: Record<string, number>;
  top_positive_tags: [string, number][];
  top_negative_tags: [string, number][];
}

export interface AvailableTagsResponse {
  positive_tags: string[];
  negative_tags: string[];
}

export interface ListTagsParams {
  audio_id?: string;
  tag?: string;
  is_positive?: boolean;
  page?: number;
  limit?: number;
}
