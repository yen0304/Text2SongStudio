import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API module', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchApi helper', () => {
    it('makes GET requests with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      // Import fresh to test actual implementation
      const { api } = await import('@/lib/api');
      
      // This will trigger a fetch call
      await api.listPrompts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('handles API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      const { api } = await import('@/lib/api');

      await expect(api.getPrompt('nonexistent')).rejects.toThrow('Not found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { api } = await import('@/lib/api');

      await expect(api.getPrompt('test')).rejects.toThrow('Network error');
    });
  });

  describe('API methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });
    });

    it('createPrompt sends POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'prompt-1', text: 'test' }),
      });

      const { api } = await import('@/lib/api');
      await api.createPrompt({ text: 'test prompt' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'test prompt' }),
        })
      );
    });

    it('submitFeedback sends correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'feedback-1' }),
      });

      const { api } = await import('@/lib/api');
      await api.submitFeedback({
        audio_id: 'audio-1',
        rating: 5,
        tags: ['good'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/feedback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('audio_id'),
        })
      );
    });

    it('getAudioStreamUrl returns correct URL', async () => {
      const { api } = await import('@/lib/api');
      const url = api.getAudioStreamUrl('audio-123');
      
      expect(url).toContain('/audio/audio-123/stream');
    });

    it('listAdapters handles activeOnly parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { api } = await import('@/lib/api');
      await api.listAdapters({ activeOnly: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('active_only=true'),
        expect.any(Object)
      );
    });

    it('listFeedback builds query params correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { api } = await import('@/lib/api');
      await api.listFeedback({ audio_id: 'audio-1', min_rating: 3 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/audio_id=audio-1.*min_rating=3|min_rating=3.*audio_id=audio-1/),
        expect.any(Object)
      );
    });

    it('getOverviewMetrics returns metrics data', async () => {
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

      const { api } = await import('@/lib/api');
      const result = await api.getOverviewMetrics();

      expect(result).toEqual(mockMetrics);
    });

    it('listJobs fetches jobs with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { api } = await import('@/lib/api');
      await api.listJobs({ status: 'pending' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.any(Object)
      );
    });

    it('getJobStatus fetches a specific job', async () => {
      const mockJob = { id: 'job-1', status: 'completed' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJob),
      });

      const { api } = await import('@/lib/api');
      const result = await api.getJobStatus('job-1');

      expect(result).toEqual(mockJob);
    });

    it('cancelJob sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(undefined),
      });

      const { api } = await import('@/lib/api');
      await api.cancelJob('job-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/generate/job-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('getAudioMetadata fetches audio metadata', async () => {
      const mockMetadata = { id: 'audio-1', duration_seconds: 10 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      });

      const { api } = await import('@/lib/api');
      const result = await api.getAudioMetadata('audio-1');

      expect(result).toEqual(mockMetadata);
    });

    it('listDatasets fetches datasets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { api } = await import('@/lib/api');
      await api.listDatasets();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets'),
        expect.any(Object)
      );
    });

    it('createDataset sends dataset creation request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'dataset-1' }),
      });

      const { api } = await import('@/lib/api');
      await api.createDataset({
        name: 'Test Dataset',
        type: 'supervised',
        filter_query: { min_rating: 4 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getJobFeedback fetches feedback for a job', async () => {
      const mockFeedback = { job_id: 'job-1', samples: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFeedback),
      });

      const { api } = await import('@/lib/api');
      const result = await api.getJobFeedback('job-1');

      expect(result).toEqual(mockFeedback);
    });

    it('getFeedbackStats fetches feedback statistics', async () => {
      const mockStats = { total: 100, average_rating: 4.2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const { api } = await import('@/lib/api');
      const result = await api.getFeedbackStats();

      expect(result).toEqual(mockStats);
    });
  });
});
