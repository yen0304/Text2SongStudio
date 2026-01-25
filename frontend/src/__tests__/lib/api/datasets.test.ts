import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Datasets API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('lists datasets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    await datasetsApi.list();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/datasets'),
      expect.any(Object)
    );
  });

  it('gets dataset by ID', async () => {
    const mockDataset = { id: 'dataset-1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDataset),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    const result = await datasetsApi.get('dataset-1');

    expect(result).toEqual(mockDataset);
  });

  it('creates dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'dataset-1' }),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    await datasetsApi.create({
      name: 'Test Dataset',
      type: 'supervised',
      filter_query: { min_rating: 4 },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/datasets'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('exports dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ dataset_id: 'dataset-1', export_path: '/path' }),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    await datasetsApi.export('dataset-1', 'jsonl');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/datasets/dataset-1/export'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('gets dataset stats', async () => {
    const mockStats = { dataset_id: 'dataset-1', sample_count: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    const result = await datasetsApi.getStats('dataset-1');

    expect(result).toEqual(mockStats);
  });

  it('previews dataset count', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ count: 50 }),
    });

    const { datasetsApi } = await import('@/lib/api/modules/datasets');
    const result = await datasetsApi.previewCount('supervised', { min_rating: 4 });

    expect(result).toEqual({ count: 50 });
  });
});
