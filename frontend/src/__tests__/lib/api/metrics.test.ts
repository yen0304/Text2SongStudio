import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Metrics API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('gets overview metrics', async () => {
    const mockMetrics = {
      pipeline: {
        generation: { total: 100, completed: 80, active: 5 },
        feedback: { total: 200, rated_samples: 150, pending: 25 },
        dataset: { total: 10, exported: 5 },
        training: { total: 5, running: 1 },
      },
      quick_stats: {},
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    const { metricsApi } = await import('@/lib/api/modules/metrics');
    const result = await metricsApi.getOverview();

    expect(result).toEqual(mockMetrics);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/metrics/overview'),
      expect.any(Object)
    );
  });

  it('gets feedback metrics', async () => {
    const mockMetrics = {
      rating_distribution: { 1: 10, 2: 20, 3: 30 },
      by_adapter: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    const { metricsApi } = await import('@/lib/api/modules/metrics');
    const result = await metricsApi.getFeedback();

    expect(result).toEqual(mockMetrics);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/metrics/feedback'),
      expect.any(Object)
    );
  });
});
