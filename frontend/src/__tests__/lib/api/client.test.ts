import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client (fetchApi)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchApi helper', () => {
    it('makes GET requests with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const { fetchApi } = await import('@/lib/api/client');
      await fetchApi('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('handles API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      const { fetchApi } = await import('@/lib/api/client');
      await expect(fetchApi('/test')).rejects.toThrow('Not found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { fetchApi } = await import('@/lib/api/client');
      await expect(fetchApi('/test')).rejects.toThrow('Network error');
    });

    it('handles JSON parse errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { fetchApi } = await import('@/lib/api/client');
      await expect(fetchApi('/test')).rejects.toThrow('API error: 500');
    });
  });

  describe('buildQueryString', () => {
    it('builds query string from params', async () => {
      const { buildQueryString } = await import('@/lib/api/client');
      
      const result = buildQueryString({
        foo: 'bar',
        num: 123,
        bool: true,
      });
      
      expect(result).toBe('?foo=bar&num=123&bool=true');
    });

    it('filters out undefined and null values', async () => {
      const { buildQueryString } = await import('@/lib/api/client');
      
      const result = buildQueryString({
        foo: 'bar',
        empty: undefined,
        nullVal: null,
      });
      
      expect(result).toBe('?foo=bar');
    });

    it('returns empty string when no params', async () => {
      const { buildQueryString } = await import('@/lib/api/client');
      
      const result = buildQueryString({});
      expect(result).toBe('');
    });
  });
});
