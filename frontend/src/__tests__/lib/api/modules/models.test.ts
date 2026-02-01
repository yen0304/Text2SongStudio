/**
 * Tests for Models API Module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modelsApi } from '@/lib/api/modules/models';
import * as client from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  fetchApi: vi.fn(),
  API_BASE: 'http://localhost:8000/api/v1',
}));

describe('modelsApi', () => {
  const mockFetchApi = vi.mocked(client.fetchApi);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('lists all available models', async () => {
      const mockResponse = {
        models: [
          { id: 'musicgen-small', name: 'MusicGen Small', size: '300M' },
          { id: 'musicgen-medium', name: 'MusicGen Medium', size: '1.5B' },
        ],
        current: 'musicgen-small',
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await modelsApi.list();

      expect(mockFetchApi).toHaveBeenCalledWith('/models');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrent', () => {
    it('gets the current model configuration', async () => {
      const mockConfig = {
        id: 'musicgen-small',
        name: 'MusicGen Small',
        max_duration: 30,
        sample_rate: 32000,
      };
      mockFetchApi.mockResolvedValue(mockConfig);

      const result = await modelsApi.getCurrent();

      expect(mockFetchApi).toHaveBeenCalledWith('/models/current');
      expect(result).toEqual(mockConfig);
    });
  });

  describe('switchModel', () => {
    it('switches to a different model', async () => {
      const mockResponse = {
        success: true,
        model_id: 'musicgen-medium',
        message: 'Model switched successfully',
      };
      mockFetchApi.mockResolvedValue(mockResponse);

      const result = await modelsApi.switchModel('musicgen-medium');

      expect(mockFetchApi).toHaveBeenCalledWith('/models/switch', {
        method: 'POST',
        body: JSON.stringify({ model_id: 'musicgen-medium' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('switchModelStream', () => {
    it('streams model switch progress', async () => {
      const mockEvents = [
        { event: 'status', message: 'Downloading model...', progress: 0 },
        { event: 'status', message: 'Loading model...', progress: 50 },
        { event: 'done', message: 'Model loaded', progress: 100, model_id: 'musicgen-medium' },
      ];

      // Create a mock readable stream
      const encoder = new TextEncoder();
      const streamData = mockEvents.map((event, i) => 
        `event: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`
      ).join('');

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(streamData));
          controller.close();
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });
      global.fetch = mockFetch;

      const progressCalls: unknown[] = [];
      const result = await modelsApi.switchModelStream('musicgen-medium', (event) => {
        progressCalls.push(event);
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/models/switch/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: 'musicgen-medium' }),
      });
      expect(progressCalls).toHaveLength(3);
      expect(result.event).toBe('done');
    });

    it('handles stream error response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });
      global.fetch = mockFetch;

      await expect(
        modelsApi.switchModelStream('invalid-model', vi.fn())
      ).rejects.toThrow('Failed to switch model: Internal Server Error');
    });

    it('handles missing response body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });
      global.fetch = mockFetch;

      await expect(
        modelsApi.switchModelStream('musicgen-medium', vi.fn())
      ).rejects.toThrow('No response body');
    });

    it('handles stream ending with error event', async () => {
      const encoder = new TextEncoder();
      const errorEvent = { event: 'error', message: 'Model not found', code: 'MODEL_NOT_FOUND' };
      const streamData = `event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(streamData));
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const progressCalls: unknown[] = [];
      const result = await modelsApi.switchModelStream('musicgen-medium', (event) => {
        progressCalls.push(event);
      });

      expect(result.event).toBe('error');
      expect(result.message).toBe('Model not found');
    });

    it('handles stream ending unexpectedly without completion', async () => {
      const encoder = new TextEncoder();
      const statusEvent = { event: 'status', message: 'Loading...', progress: 50 };
      const streamData = `event: status\ndata: ${JSON.stringify(statusEvent)}\n\n`;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(streamData));
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await expect(
        modelsApi.switchModelStream('musicgen-medium', vi.fn())
      ).rejects.toThrow('Stream ended unexpectedly without completion event');
    });

    it('handles malformed JSON in stream gracefully', async () => {
      const encoder = new TextEncoder();
      const doneEvent = { event: 'done', message: 'Complete', progress: 100 };
      const streamData = `event: status\ndata: {invalid json}\n\nevent: done\ndata: ${JSON.stringify(doneEvent)}\n\n`;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(streamData));
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const progressCalls: unknown[] = [];
      const result = await modelsApi.switchModelStream('musicgen-medium', (event) => {
        progressCalls.push(event);
      });

      // Should skip invalid JSON and continue to done event
      expect(result.event).toBe('done');
      expect(progressCalls).toHaveLength(1);
    });
  });
});
