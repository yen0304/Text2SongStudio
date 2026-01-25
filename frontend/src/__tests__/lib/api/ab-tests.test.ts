import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('A/B Tests API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('lists A/B tests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    await abTestsApi.list({ status: 'active' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ab-tests'),
      expect.any(Object)
    );
  });

  it('gets A/B test by ID', async () => {
    const mockTest = { id: 'test-1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTest),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    const result = await abTestsApi.get('test-1');

    expect(result).toEqual(mockTest);
  });

  it('creates A/B test', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-1' }),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    await abTestsApi.create({ name: 'New Test', prompt_ids: ['p1', 'p2'] });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ab-tests'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('generates samples for A/B test', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-1' }),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    await abTestsApi.generateSamples('test-1', { samples_per_prompt: 3 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ab-tests/test-1/generate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('submits vote for A/B test', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pair-1', preference: 'a' }),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    await abTestsApi.submitVote('test-1', 'pair-1', 'a');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ab-tests/test-1/vote'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('pair_id'),
      })
    );
  });

  it('gets A/B test results', async () => {
    const mockResults = { id: 'test-1', a_win_rate: 0.6 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    const { abTestsApi } = await import('@/lib/api/modules/ab-tests');
    const result = await abTestsApi.getResults('test-1');

    expect(result).toEqual(mockResults);
  });
});
