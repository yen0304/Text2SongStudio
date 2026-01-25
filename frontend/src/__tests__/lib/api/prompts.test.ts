import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Prompts API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('creates a prompt with POST request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prompt-1', text: 'test' }),
    });

    const { promptsApi } = await import('@/lib/api/modules/prompts');
    await promptsApi.create({ text: 'test prompt' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/prompts'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'test prompt' }),
      })
    );
  });

  it('gets a prompt by ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prompt-1', text: 'test' }),
    });

    const { promptsApi } = await import('@/lib/api/modules/prompts');
    const result = await promptsApi.get('prompt-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/prompts/prompt-1'),
      expect.any(Object)
    );
    expect(result.id).toBe('prompt-1');
  });

  it('lists prompts with pagination', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { promptsApi } = await import('@/lib/api/modules/prompts');
    await promptsApi.list(2, 10);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/prompts\?page=2&limit=10/),
      expect.any(Object)
    );
  });
});
