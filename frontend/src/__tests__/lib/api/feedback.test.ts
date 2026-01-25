import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Feedback API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('submits feedback with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'feedback-1' }),
    });

    const { feedbackApi } = await import('@/lib/api/modules/feedback');
    await feedbackApi.submit({
      audio_id: 'audio-1',
      rating: 5,
      tags: ['good'],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/feedback'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('audio_id'),
      })
    );
  });

  it('lists feedback with filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { feedbackApi } = await import('@/lib/api/modules/feedback');
    await feedbackApi.list({ audio_id: 'audio-1', min_rating: 3 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/audio_id=audio-1.*min_rating=3|min_rating=3.*audio_id=audio-1/),
      expect.any(Object)
    );
  });

  it('deletes feedback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'deleted' }),
    });

    const { feedbackApi } = await import('@/lib/api/modules/feedback');
    await feedbackApi.delete('feedback-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/feedback/feedback-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('gets feedback stats', async () => {
    const mockStats = { total_feedback: 100, average_rating: 4.2 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { feedbackApi } = await import('@/lib/api/modules/feedback');
    const result = await feedbackApi.getStats();

    expect(result).toEqual(mockStats);
  });
});
