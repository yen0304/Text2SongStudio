/**
 * Tests for Experiments API Module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { experimentsApi, ListExperimentsParams } from '@/lib/api/modules/experiments';
import * as client from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  fetchApi: vi.fn(),
  buildQueryString: vi.fn((params) => {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
    if (filtered.length === 0) return '';
    return '?' + filtered.map(([k, v]) => `${k}=${v}`).join('&');
  }),
}));

describe('experimentsApi', () => {
  const mockFetchApi = vi.mocked(client.fetchApi);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('lists experiments without params', async () => {
      const mockResponse = {
        items: [{ id: 'exp-1', name: 'Test Experiment' }],
        total: 1,
        limit: 20,
        offset: 0,
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await experimentsApi.list();

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments');
      expect(result).toEqual(mockResponse);
    });

    it('lists experiments with status filter', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0 });

      await experimentsApi.list({ status: 'running' });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments?status=running');
    });

    it('lists experiments including archived', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0 });

      await experimentsApi.list({ include_archived: true });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments?include_archived=true');
    });

    it('lists experiments with pagination', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 100, limit: 10, offset: 20 });

      await experimentsApi.list({ limit: 10, offset: 20 });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments?limit=10&offset=20');
    });
  });

  describe('get', () => {
    it('gets a specific experiment', async () => {
      const mockExperiment = {
        id: 'exp-1',
        name: 'Test Experiment',
        runs: [],
      };
      mockFetchApi.mockResolvedValue(mockExperiment);

      const result = await experimentsApi.get('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1');
      expect(result).toEqual(mockExperiment);
    });
  });

  describe('create', () => {
    it('creates a new experiment', async () => {
      const mockExperiment = {
        id: 'exp-new',
        name: 'New Experiment',
        description: 'Test description',
      };
      mockFetchApi.mockResolvedValue(mockExperiment);

      const result = await experimentsApi.create({
        name: 'New Experiment',
        description: 'Test description',
      });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Experiment',
          description: 'Test description',
        }),
      });
      expect(result).toEqual(mockExperiment);
    });
  });

  describe('update', () => {
    it('updates an experiment', async () => {
      const mockExperiment = {
        id: 'exp-1',
        name: 'Updated Experiment',
      };
      mockFetchApi.mockResolvedValue(mockExperiment);

      const result = await experimentsApi.update('exp-1', { name: 'Updated Experiment' });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Experiment' }),
      });
      expect(result).toEqual(mockExperiment);
    });
  });

  describe('delete', () => {
    it('deletes an experiment', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await experimentsApi.delete('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1', { method: 'DELETE' });
    });
  });

  describe('archive', () => {
    it('archives an experiment', async () => {
      const mockExperiment = { id: 'exp-1', is_archived: true };
      mockFetchApi.mockResolvedValue(mockExperiment);

      const result = await experimentsApi.archive('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/archive', { method: 'POST' });
      expect(result).toEqual(mockExperiment);
    });
  });

  describe('unarchive', () => {
    it('unarchives an experiment', async () => {
      const mockExperiment = { id: 'exp-1', is_archived: false };
      mockFetchApi.mockResolvedValue(mockExperiment);

      const result = await experimentsApi.unarchive('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/unarchive', { method: 'POST' });
      expect(result).toEqual(mockExperiment);
    });
  });

  describe('createRun', () => {
    it('creates a run with data', async () => {
      const mockRun = { id: 'run-1', experiment_id: 'exp-1', status: 'pending' };
      mockFetchApi.mockResolvedValue(mockRun);

      const result = await experimentsApi.createRun('exp-1', { config: { epochs: 10 } });

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/runs', {
        method: 'POST',
        body: JSON.stringify({ config: { epochs: 10 } }),
      });
      expect(result).toEqual(mockRun);
    });

    it('creates a run without data', async () => {
      const mockRun = { id: 'run-1', experiment_id: 'exp-1', status: 'pending' };
      mockFetchApi.mockResolvedValue(mockRun);

      const result = await experimentsApi.createRun('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/runs', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockRun);
    });
  });

  describe('deleteRun', () => {
    it('deletes a single run', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await experimentsApi.deleteRun('exp-1', 'run-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/runs/run-1', { method: 'DELETE' });
    });
  });

  describe('deleteRunsBatch', () => {
    it('deletes multiple runs', async () => {
      mockFetchApi.mockResolvedValue({ deleted: 3 });

      const result = await experimentsApi.deleteRunsBatch('exp-1', ['run-1', 'run-2', 'run-3']);

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/experiments/exp-1/runs?run_ids=run-1&run_ids=run-2&run_ids=run-3',
        { method: 'DELETE' }
      );
      expect(result).toEqual({ deleted: 3 });
    });
  });

  describe('getMetrics', () => {
    it('gets experiment metrics', async () => {
      const mockMetrics = {
        total_runs: 10,
        completed_runs: 8,
        average_loss: 0.05,
      };
      mockFetchApi.mockResolvedValue(mockMetrics);

      const result = await experimentsApi.getMetrics('exp-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/metrics');
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getRunMetrics', () => {
    it('gets run metrics without params', async () => {
      const mockMetrics = {
        metrics: [{ step: 1, loss: 0.5 }],
      };
      mockFetchApi.mockResolvedValue(mockMetrics);

      const result = await experimentsApi.getRunMetrics('exp-1', 'run-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/experiments/exp-1/runs/run-1/metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('gets run metrics with metric type filter', async () => {
      mockFetchApi.mockResolvedValue({ metrics: [] });

      await experimentsApi.getRunMetrics('exp-1', 'run-1', { metric_type: 'loss' });

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/experiments/exp-1/runs/run-1/metrics?metric_type=loss'
      );
    });

    it('gets run metrics with step range', async () => {
      mockFetchApi.mockResolvedValue({ metrics: [] });

      await experimentsApi.getRunMetrics('exp-1', 'run-1', { min_step: 100, max_step: 500 });

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/experiments/exp-1/runs/run-1/metrics?min_step=100&max_step=500'
      );
    });
  });
});
