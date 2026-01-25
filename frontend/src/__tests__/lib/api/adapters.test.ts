import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Adapters API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('lists adapters with activeOnly filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.list({ activeOnly: true });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('active_only=true'),
      expect.any(Object)
    );
  });

  it('gets adapter stats', async () => {
    const mockStats = { total: 5, active: 3 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    const result = await adaptersApi.getStats();

    expect(result).toEqual(mockStats);
  });

  it('gets adapter by ID', async () => {
    const mockAdapter = { id: 'adapter-1', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdapter),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    const result = await adaptersApi.get('adapter-1');

    expect(result).toEqual(mockAdapter);
  });

  it('gets adapter timeline', async () => {
    const mockTimeline = { adapter_id: 'adapter-1', events: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTimeline),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    const result = await adaptersApi.getTimeline('adapter-1');

    expect(result).toEqual(mockTimeline);
  });

  it('creates adapter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'adapter-1' }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.create({ name: 'New Adapter' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('New Adapter'),
      })
    );
  });

  it('updates adapter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'adapter-1' }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.update('adapter-1', { name: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters/adapter-1'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('deletes adapter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'deleted' }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.delete('adapter-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters/adapter-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('creates adapter version', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'version-1' }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.createVersion('adapter-1', { version: '1.0.0' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters/adapter-1/versions'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('activates adapter version', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'activated' }),
    });

    const { adaptersApi } = await import('@/lib/api/modules/adapters');
    await adaptersApi.activateVersion('adapter-1', 'version-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/adapters/adapter-1/versions/version-1/activate'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
