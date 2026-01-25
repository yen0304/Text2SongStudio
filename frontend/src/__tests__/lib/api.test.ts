import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Modular API Tests
 * 
 * These tests verify the modular API structure.
 * For detailed API tests, see the test files in __tests__/lib/api/
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Modular API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('promptsApi', () => {
    it('list makes GET requests with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { promptsApi } = await import('@/lib/api');
      await promptsApi.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('get handles API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      const { promptsApi } = await import('@/lib/api');
      await expect(promptsApi.get('nonexistent')).rejects.toThrow('Not found');
    });

    it('get handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { promptsApi } = await import('@/lib/api');
      await expect(promptsApi.get('test')).rejects.toThrow('Network error');
    });

    it('create sends POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'prompt-1', text: 'test' }),
      });

      const { promptsApi } = await import('@/lib/api');
      await promptsApi.create({ text: 'test prompt' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'test prompt' }),
        })
      );
    });
  });

  describe('feedbackApi', () => {
    it('submit sends correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'feedback-1' }),
      });

      const { feedbackApi } = await import('@/lib/api');
      await feedbackApi.submit({
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

    it('list builds query params correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { feedbackApi } = await import('@/lib/api');
      await feedbackApi.list({ audio_id: 'audio-1', min_rating: 3 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/audio_id=audio-1.*min_rating=3|min_rating=3.*audio_id=audio-1/),
        expect.any(Object)
      );
    });

    it('getStats returns stats data', async () => {
      const mockStats = { total: 100, average_rating: 4.2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const { feedbackApi } = await import('@/lib/api');
      const result = await feedbackApi.getStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('audioApi', () => {
    it('getStreamUrl returns correct URL', async () => {
      const { audioApi } = await import('@/lib/api');
      const url = audioApi.getStreamUrl('audio-123');
      
      expect(url).toContain('/audio/audio-123/stream');
    });

    it('getMetadata fetches audio metadata', async () => {
      const mockMetadata = { id: 'audio-1', duration_seconds: 10 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      });

      const { audioApi } = await import('@/lib/api');
      const result = await audioApi.getMetadata('audio-1');

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('adaptersApi', () => {
    it('list handles activeOnly parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { adaptersApi } = await import('@/lib/api');
      await adaptersApi.list({ activeOnly: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('active_only=true'),
        expect.any(Object)
      );
    });
  });

  describe('metricsApi', () => {
    it('getOverview returns metrics data', async () => {
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

      const { metricsApi } = await import('@/lib/api');
      const result = await metricsApi.getOverview();

      expect(result).toEqual(mockMetrics);
    });
  });

  describe('generationApi', () => {
    it('listJobs fetches jobs with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { generationApi } = await import('@/lib/api');
      await generationApi.listJobs({ status: 'pending' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs'),
        expect.any(Object)
      );
    });

    it('getStatus fetches a specific job', async () => {
      const mockJob = { id: 'job-1', status: 'completed' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJob),
      });

      const { generationApi } = await import('@/lib/api');
      const result = await generationApi.getStatus('job-1');

      expect(result).toEqual(mockJob);
    });

    it('cancel sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(undefined),
      });

      const { generationApi } = await import('@/lib/api');
      await generationApi.cancel('job-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/generate/job-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('getJobFeedback fetches feedback for a job', async () => {
      const mockFeedback = { job_id: 'job-1', samples: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFeedback),
      });

      const { generationApi } = await import('@/lib/api');
      const result = await generationApi.getJobFeedback('job-1');

      expect(result).toEqual(mockFeedback);
    });
  });

  describe('datasetsApi', () => {
    it('list fetches datasets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      });

      const { datasetsApi } = await import('@/lib/api');
      await datasetsApi.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets'),
        expect.any(Object)
      );
    });

    it('create sends dataset creation request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'dataset-1' }),
      });

      const { datasetsApi } = await import('@/lib/api');
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
  });

  describe('Modular API exports', () => {
    it('exports all modular APIs', async () => {
      const apiModule = await import('@/lib/api');
      
      // Check that modular APIs are exported
      expect(apiModule.promptsApi).toBeDefined();
      expect(apiModule.audioApi).toBeDefined();
      expect(apiModule.generationApi).toBeDefined();
      expect(apiModule.feedbackApi).toBeDefined();
      expect(apiModule.adaptersApi).toBeDefined();
      expect(apiModule.datasetsApi).toBeDefined();
      expect(apiModule.experimentsApi).toBeDefined();
      expect(apiModule.abTestsApi).toBeDefined();
      expect(apiModule.metricsApi).toBeDefined();
    });

    it('exports utility functions', async () => {
      const apiModule = await import('@/lib/api');
      
      expect(apiModule.fetchApi).toBeDefined();
      expect(apiModule.buildQueryString).toBeDefined();
      expect(apiModule.ApiError).toBeDefined();
    });
  });
});
