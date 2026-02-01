/**
 * Favorites API Module
 * 
 * Handles all favorites-related API operations
 */

import { fetchApi } from '../client';
import type { 
  Favorite, 
  FavoriteWithDetails,
  CreateFavoriteRequest, 
  UpdateFavoriteRequest, 
  ListFavoritesParams,
  TargetType 
} from '../types/favorites';
import type { PaginatedResponse } from '../types/common';

export const favoritesApi = {
  /**
   * Add an item to favorites
   */
  create: (data: CreateFavoriteRequest) =>
    fetchApi<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a favorite by ID
   */
  get: (id: string) => 
    fetchApi<Favorite>(`/favorites/${id}`),

  /**
   * List favorites with optional filtering
   */
  list: (params: ListFavoritesParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.target_type) searchParams.append('target_type', params.target_type);
    
    const queryString = searchParams.toString();
    return fetchApi<PaginatedResponse<FavoriteWithDetails>>(`/favorites${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Update a favorite's note
   */
  update: (id: string, data: UpdateFavoriteRequest) =>
    fetchApi<Favorite>(`/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Remove an item from favorites by favorite ID
   */
  delete: (id: string) =>
    fetchApi<void>(`/favorites/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Remove an item from favorites by target type and ID
   */
  deleteByTarget: (targetType: TargetType, targetId: string) =>
    fetchApi<void>(`/favorites/by-target/${targetType}/${targetId}`, {
      method: 'DELETE',
    }),

  /**
   * Check if an item is favorited
   */
  check: (targetType: TargetType, targetId: string) =>
    fetchApi<Favorite | null>(`/favorites/check/${targetType}/${targetId}`),

  /**
   * Toggle favorite status for an item
   * Returns the favorite if created, null if deleted
   */
  toggle: async (targetType: TargetType, targetId: string, note?: string): Promise<Favorite | null> => {
    const existing = await favoritesApi.check(targetType, targetId);
    if (existing) {
      await favoritesApi.deleteByTarget(targetType, targetId);
      return null;
    } else {
      return favoritesApi.create({ target_type: targetType, target_id: targetId, note });
    }
  },
};
