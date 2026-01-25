/**
 * Tests for deletion API methods (jobs, adapters, feedback).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import modular APIs after mocking
import { generationApi, adaptersApi, feedbackApi } from '../lib/api';

describe('Deletion API Methods', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('generationApi.deleteJob', () => {
    it('should call DELETE /jobs/{jobId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'deleted', job_id: 'test-job-id' }),
      });

      const result = await generationApi.deleteJob('test-job-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/test-job-id'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.status).toBe('deleted');
    });

    it('should throw on 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Job not found' }),
      });

      await expect(generationApi.deleteJob('nonexistent-id')).rejects.toThrow('Job not found');
    });
  });

  describe('adaptersApi.delete', () => {
    it('should call DELETE /adapters/{adapterId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'deleted', adapter_id: 'test-adapter-id' }),
      });

      const result = await adaptersApi.delete('test-adapter-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/adapters/test-adapter-id'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.status).toBe('deleted');
    });

    it('should throw on 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Adapter not found' }),
      });

      await expect(adaptersApi.delete('nonexistent-id')).rejects.toThrow('Adapter not found');
    });
  });

  describe('feedbackApi.delete', () => {
    it('should call DELETE /feedback/{feedbackId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'deleted', feedback_id: 'test-feedback-id' }),
      });

      const result = await feedbackApi.delete('test-feedback-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/feedback/test-feedback-id'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.status).toBe('deleted');
    });

    it('should throw on 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Feedback not found' }),
      });

      await expect(feedbackApi.delete('nonexistent-id')).rejects.toThrow('Feedback not found');
    });
  });

  describe('generationApi.getJob', () => {
    it('should call GET /jobs/{jobId}', async () => {
      const mockJob = {
        id: 'test-job-id',
        prompt_id: 'test-prompt-id',
        status: 'completed',
        progress: 1.0,
        num_samples: 2,
        audio_ids: ['audio-1', 'audio-2'],
        created_at: '2026-01-25T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      });

      const result = await generationApi.getJob('test-job-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/test-job-id'),
        expect.any(Object)
      );
      expect(result.id).toBe('test-job-id');
      expect(result.status).toBe('completed');
    });

    it('should throw on 404 for deleted job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Job not found' }),
      });

      await expect(generationApi.getJob('deleted-job-id')).rejects.toThrow('Job not found');
    });
  });
});
