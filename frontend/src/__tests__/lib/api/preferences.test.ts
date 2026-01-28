import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Preferences API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('submits a preference pair', async () => {
    const mockPreference = {
      id: 'pref-1',
      prompt_id: 'prompt-1',
      chosen_audio_id: 'audio-1',
      rejected_audio_id: 'audio-2',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreference),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.submit({
      prompt_id: 'prompt-1',
      chosen_audio_id: 'audio-1',
      rejected_audio_id: 'audio-2',
    });

    expect(result).toEqual(mockPreference);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/preferences'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('gets a preference by ID', async () => {
    const mockPreference = {
      id: 'pref-1',
      prompt_id: 'prompt-1',
      chosen_audio_id: 'audio-1',
      rejected_audio_id: 'audio-2',
      prompt_text: 'A calm melody',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreference),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.get('pref-1');

    expect(result).toEqual(mockPreference);
  });

  it('lists preferences without params', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.list();

    expect(result).toEqual(mockResponse);
  });

  it('lists preferences with all params', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    await preferencesApi.list({
      prompt_id: 'prompt-1',
      audio_id: 'audio-1',
      page: 1,
      limit: 10,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('prompt_id=prompt-1'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('audio_id=audio-1'),
      expect.any(Object)
    );
  });

  it('gets preferences for prompt', async () => {
    const mockResponse = { items: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.getForPrompt('prompt-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/preferences/prompt/prompt-1'),
      expect.any(Object)
    );
  });

  it('deletes a preference', async () => {
    const mockResponse = { status: 'deleted', id: 'pref-1' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.delete('pref-1');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/preferences/pref-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('gets preference stats', async () => {
    const mockStats = {
      total_pairs: 100,
      unique_prompts: 50,
      unique_audios: 80,
      average_margin: 3.5,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { preferencesApi } = await import('@/lib/api/modules/preferences');
    const result = await preferencesApi.getStats();

    expect(result).toEqual(mockStats);
  });
});
