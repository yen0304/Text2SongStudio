/**
 * Tests for Prompts API Module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptsApi, SearchPromptsParams } from '@/lib/api/modules/prompts';
import * as client from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  fetchApi: vi.fn(),
}));

describe('promptsApi', () => {
  const mockFetchApi = vi.mocked(client.fetchApi);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a new prompt', async () => {
      const mockPrompt = {
        id: 'prompt-1',
        text: 'A jazzy piano tune',
        attributes: { style: 'jazz', mood: 'happy' },
        created_at: '2024-01-01T00:00:00Z',
      };
      mockFetchApi.mockResolvedValue(mockPrompt);

      const result = await promptsApi.create({ text: 'A jazzy piano tune' });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts', {
        method: 'POST',
        body: JSON.stringify({ text: 'A jazzy piano tune' }),
      });
      expect(result).toEqual(mockPrompt);
    });
  });

  describe('get', () => {
    it('gets a prompt by ID', async () => {
      const mockPrompt = {
        id: 'prompt-1',
        text: 'Test prompt',
        created_at: '2024-01-01T00:00:00Z',
      };
      mockFetchApi.mockResolvedValue(mockPrompt);

      const result = await promptsApi.get('prompt-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/prompt-1');
      expect(result).toEqual(mockPrompt);
    });
  });

  describe('list', () => {
    it('lists prompts with default pagination', async () => {
      const mockResponse = {
        items: [{ id: 'prompt-1', text: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await promptsApi.list();

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('lists prompts with custom pagination', async () => {
      const mockResponse = {
        items: [],
        total: 50,
        page: 3,
        limit: 10,
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await promptsApi.list(3, 10);

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts?page=3&limit=10');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search', () => {
    it('searches prompts with empty params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        query: null,
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await promptsApi.search();

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search');
      expect(result).toEqual(mockResponse);
    });

    it('searches prompts with query string', async () => {
      const mockResponse = {
        items: [{ id: 'prompt-1', text: 'Jazz piano' }],
        total: 1,
        page: 1,
        limit: 20,
        query: 'jazz',
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await promptsApi.search({ q: 'jazz' });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search?q=jazz');
      expect(result).toEqual(mockResponse);
    });

    it('searches prompts with style filter', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0, query: 'classical' });

      await promptsApi.search({ style: 'classical' });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search?style=classical');
    });

    it('searches prompts with mood filter', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0, query: null });

      await promptsApi.search({ mood: 'happy' });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search?mood=happy');
    });

    it('searches prompts with tempo range', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0, query: null });

      await promptsApi.search({ tempo_min: 60, tempo_max: 120 });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search?tempo_min=60&tempo_max=120');
    });

    it('searches prompts with date range', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 0, query: null });

      await promptsApi.search({ 
        date_from: '2024-01-01', 
        date_to: '2024-12-31' 
      });

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/prompts/search?date_from=2024-01-01&date_to=2024-12-31'
      );
    });

    it('searches prompts with pagination', async () => {
      mockFetchApi.mockResolvedValue({ items: [], total: 100, query: null });

      await promptsApi.search({ page: 2, limit: 50 });

      expect(mockFetchApi).toHaveBeenCalledWith('/prompts/search?page=2&limit=50');
    });

    it('searches prompts with all parameters', async () => {
      const params: SearchPromptsParams = {
        q: 'piano',
        style: 'jazz',
        mood: 'relaxed',
        tempo_min: 80,
        tempo_max: 100,
        date_from: '2024-01-01',
        date_to: '2024-06-30',
        page: 1,
        limit: 10,
      };
      mockFetchApi.mockResolvedValue({ items: [], total: 0, query: 'piano' });

      await promptsApi.search(params);

      const expectedUrl = '/prompts/search?q=piano&style=jazz&mood=relaxed&tempo_min=80&tempo_max=100&date_from=2024-01-01&date_to=2024-06-30&page=1&limit=10';
      expect(mockFetchApi).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
