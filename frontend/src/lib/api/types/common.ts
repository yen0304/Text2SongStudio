/**
 * Shared types used across multiple API modules
 */

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
}
