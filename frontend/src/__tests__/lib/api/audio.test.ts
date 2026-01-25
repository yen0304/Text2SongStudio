import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Audio API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('gets audio metadata', async () => {
    const mockMetadata = { id: 'audio-1', duration_seconds: 10 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMetadata),
    });

    const { audioApi } = await import('@/lib/api/modules/audio');
    const result = await audioApi.getMetadata('audio-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/audio/audio-1'),
      expect.any(Object)
    );
    expect(result).toEqual(mockMetadata);
  });

  it('returns correct stream URL', async () => {
    const { audioApi } = await import('@/lib/api/modules/audio');
    const url = audioApi.getStreamUrl('audio-123');
    
    expect(url).toContain('/audio/audio-123/stream');
  });
});
