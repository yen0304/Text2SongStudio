import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { favoritesApi } from '@/lib/api';

describe('favoritesApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('create', () => {
    it('creates a new favorite', async () => {
      const mockFavorite = {
        id: 'fav-1',
        target_type: 'prompt',
        target_id: 'prompt-1',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFavorite),
      });

      const result = await favoritesApi.create({
        target_type: 'prompt',
        target_id: 'prompt-1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockFavorite);
    });
  });

  describe('get', () => {
    it('gets a favorite by id', async () => {
      const mockFavorite = { id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFavorite),
      });

      const result = await favoritesApi.get('fav-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites/fav-1',
        expect.any(Object)
      );
      expect(result).toEqual(mockFavorite);
    });
  });

  describe('list', () => {
    it('lists favorites with default params', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await favoritesApi.list();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('lists favorites filtered by target type', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await favoritesApi.list({ target_type: 'audio' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites?target_type=audio',
        expect.any(Object)
      );
    });

    it('lists favorites with pagination', async () => {
      const mockResponse = { items: [], total: 0, page: 2, limit: 10 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await favoritesApi.list({ page: 2, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites?page=2&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('delete', () => {
    it('deletes a favorite', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      await favoritesApi.delete('fav-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites/fav-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('check', () => {
    it('checks if item is favorited and returns favorite', async () => {
      const mockFavorite = { id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFavorite),
      });

      const result = await favoritesApi.check('prompt', 'prompt-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/favorites/check/prompt/prompt-1',
        expect.any(Object)
      );
      expect(result).toEqual(mockFavorite);
    });

    it('returns null if item is not favorited', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await favoritesApi.check('prompt', 'prompt-1');

      expect(result).toBeNull();
    });
  });

  describe('toggle', () => {
    it('creates favorite when item is not favorited', async () => {
      // First call: check returns null (not favorited)
      // Second call: create returns the new favorite
      const mockFavorite = { id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' };
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFavorite),
        });

      const result = await favoritesApi.toggle('prompt', 'prompt-1');

      // First call: check
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/api/favorites/check/prompt/prompt-1',
        expect.any(Object)
      );
      // Second call: create
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/api/favorites',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockFavorite);
    });

    it('deletes favorite when item is already favorited', async () => {
      // First call: check returns existing favorite
      // Second call: deleteByTarget
      const mockFavorite = { id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' };
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFavorite),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: () => Promise.resolve({}),
        });

      const result = await favoritesApi.toggle('prompt', 'prompt-1');

      // First call: check
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/api/favorites/check/prompt/prompt-1',
        expect.any(Object)
      );
      // Second call: deleteByTarget
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/api/favorites/by-target/prompt/prompt-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toBeNull();
    });

    it('includes note when creating new favorite', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'fav-1' }),
        });

      await favoritesApi.toggle('prompt', 'prompt-1', 'My note');

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/api/favorites',
        expect.objectContaining({
          body: JSON.stringify({ 
            target_type: 'prompt', 
            target_id: 'prompt-1',
            note: 'My note'
          }),
        })
      );
    });
  });
});
