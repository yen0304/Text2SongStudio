/**
 * API Client - Base HTTP client for all API calls
 * 
 * This module provides the core HTTP client functionality with:
 * - Centralized error handling
 * - Request/response logging
 * - Content-Type headers management
 */

// Use relative path '/api' to leverage Next.js rewrites and avoid CORS issues
// Falls back to direct backend URL if NEXT_PUBLIC_API_URL is explicitly set
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Handle FastAPI validation errors (detail is usually an array)
      let message = `API error: ${response.status}`;
      if (error.detail) {
        if (typeof error.detail === 'string') {
          message = error.detail;
        } else if (Array.isArray(error.detail)) {
          // FastAPI validation errors: [{loc: [...], msg: "...", type: "..."}]
          message = error.detail.map((e: { msg?: string; loc?: string[] }) => 
            e.msg || JSON.stringify(e)
          ).join(', ');
        } else {
          message = JSON.stringify(error.detail);
        }
      }
      throw new ApiError(message, response.status, message);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Build query string from params object
 * Filters out undefined/null values
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
