import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Generation API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('submits generation request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'job-1', status: 'queued' }),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    await generationApi.submit({ prompt_id: 'prompt-1', num_samples: 3 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('prompt_id'),
      })
    );
  });

  it('gets job status', async () => {
    const mockJob = { id: 'job-1', status: 'completed' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJob),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    const result = await generationApi.getStatus('job-1');

    expect(result).toEqual(mockJob);
  });

  it('gets job feedback', async () => {
    const mockFeedback = { job_id: 'job-1', samples: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFeedback),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    const result = await generationApi.getJobFeedback('job-1');

    expect(result).toEqual(mockFeedback);
  });

  it('cancels job with DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(undefined),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    await generationApi.cancel('job-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate/job-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('lists jobs with filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    await generationApi.listJobs({ status: 'pending' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/jobs'),
      expect.any(Object)
    );
  });

  it('gets job stats', async () => {
    const mockStats = { status_counts: {}, active_jobs: 5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const { generationApi } = await import('@/lib/api/modules/generation');
    const result = await generationApi.getJobStats();

    expect(result).toEqual(mockStats);
  });
});
