import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Experiments API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('lists experiments with filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    await experimentsApi.list({ status: 'running' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/experiments'),
      expect.any(Object)
    );
  });

  it('gets experiment by ID', async () => {
    const mockExperiment = { id: 'exp-1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExperiment),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    const result = await experimentsApi.get('exp-1');

    expect(result).toEqual(mockExperiment);
  });

  it('creates experiment', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'exp-1' }),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    await experimentsApi.create({ name: 'New Experiment' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/experiments'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('updates experiment', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'exp-1' }),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    await experimentsApi.update('exp-1', { name: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/experiments/exp-1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('deletes experiment', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(undefined),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    await experimentsApi.delete('exp-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/experiments/exp-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('creates experiment run', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'run-1' }),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    await experimentsApi.createRun('exp-1', { name: 'Run 1' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/experiments/exp-1/runs'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('gets experiment metrics', async () => {
    const mockMetrics = { experiment_id: 'exp-1', run_count: 5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    const { experimentsApi } = await import('@/lib/api/modules/experiments');
    const result = await experimentsApi.getMetrics('exp-1');

    expect(result).toEqual(mockMetrics);
  });
});
