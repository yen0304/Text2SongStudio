import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Tags API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('adds a single tag', async () => {
    const mockTag = { id: 'tag-1', audio_id: 'audio-1', tag: 'good_melody', is_positive: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTag),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.add({
      audio_id: 'audio-1',
      tag: 'good_melody',
      is_positive: true,
    });

    expect(result).toEqual(mockTag);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('adds bulk tags', async () => {
    const mockTags = [
      { id: 'tag-1', audio_id: 'audio-1', tag: 'good_melody', is_positive: true },
      { id: 'tag-2', audio_id: 'audio-1', tag: 'creative', is_positive: true },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTags),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.addBulk({
      audio_id: 'audio-1',
      positive_tags: ['good_melody', 'creative'],
      negative_tags: [],
    });

    expect(result).toEqual(mockTags);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags/bulk'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('gets a tag by ID', async () => {
    const mockTag = { id: 'tag-1', audio_id: 'audio-1', tag: 'good_melody', is_positive: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTag),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.get('tag-1');

    expect(result).toEqual(mockTag);
  });

  it('lists tags without params', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.list();

    expect(result).toEqual(mockResponse);
  });

  it('lists tags with all params', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    await tagsApi.list({
      audio_id: 'audio-1',
      tag: 'good_melody',
      is_positive: true,
      page: 1,
      limit: 10,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('audio_id=audio-1'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('tag=good_melody'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('is_positive=true'),
      expect.any(Object)
    );
  });

  it('gets tags for audio', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.getForAudio('audio-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags/audio/audio-1'),
      expect.any(Object)
    );
  });

  it('replaces tags for audio', async () => {
    const mockTags = [{ id: 'tag-1', audio_id: 'audio-1', tag: 'good_melody', is_positive: true }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTags),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.replaceForAudio('audio-1', {
      positive_tags: ['good_melody'],
      negative_tags: ['noisy'],
    });

    expect(result).toEqual(mockTags);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags/audio/audio-1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('deletes a tag', async () => {
    const mockResponse = { status: 'deleted', id: 'tag-1' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.delete('tag-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags/tag-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('gets tag stats', async () => {
    const mockStats = { total_tags: 100, positive_count: 70, negative_count: 30 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.getStats();

    expect(result).toEqual(mockStats);
  });

  it('gets available tags', async () => {
    const mockAvailable = { positive: ['good_melody'], negative: ['noisy'] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAvailable),
    });

    const { tagsApi } = await import('@/lib/api/modules/tags');
    const result = await tagsApi.getAvailable();

    expect(result).toEqual(mockAvailable);
  });
});
