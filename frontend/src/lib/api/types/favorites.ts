/**
 * Favorite-related types
 */

export type TargetType = 'prompt' | 'audio';

export interface Favorite {
  id: string;
  target_type: TargetType;
  target_id: string;
  user_id: string | null;
  note: string | null;
  created_at: string;
}

export interface FavoriteWithDetails extends Favorite {
  target_preview: string | null;
  target_created_at: string | null;
}

export interface CreateFavoriteRequest {
  target_type: TargetType;
  target_id: string;
  note?: string;
}

export interface UpdateFavoriteRequest {
  note?: string;
}

export interface ListFavoritesParams {
  page?: number;
  limit?: number;
  target_type?: TargetType;
}
