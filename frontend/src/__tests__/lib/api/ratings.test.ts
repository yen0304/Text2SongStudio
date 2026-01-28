import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Ratings API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('submits a rating', async () => {
    const mockRating = {
      id: 'rating-1',
      audio_id: 'audio-1',
      rating: 4.5,
      criterion: 'overall',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRating),
    });

    const { ratingsApi } = await import('@/lib/api/modules/ratings');
    const result = await ratingsApi.submit({
      audio_id: 'audio-1',
      rating: 4.5,
      criterion: 'overall',
    });

    expect(result).toEqual(mockRating);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ratings'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('gets a rating by ID', async () => {
    const mockRating = {
      id: 'rating-1',
      audio_id: 'audio-1',
      rating: 4.5,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRating),
    });

    const { ratingsApi } = await import('@/lib/api/modules/ratings');
    const result = await ratingsApi.get('rating-1');

    expect(result).toEqual(mockRating);
  });

  it('gets ratings for audio', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { ratingsApi } = await import('@/lib/api/modules/ratings');
    const result = await ratingsApi.getForAudio('audio-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ratings/audio/audio-1'),
      expect.any(Object)
    );
  });

  it('deletes a rating', async () => {
    const mockResponse = { status: 'deleted', id: 'rating-1' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { ratingsApi } = await import('@/lib/api/modules/ratings');
    const result = await ratingsApi.delete('rating-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ratings/rating-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('gets rating stats', async () => {
    const mockStats = {
      total_ratings: 100,
      average_rating: 4.2,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { ratingsApi } = await import('@/lib/api/modules/ratings');
    const result = await ratingsApi.getStats();

    expect(result).toEqual(mockStats);
  });
});
