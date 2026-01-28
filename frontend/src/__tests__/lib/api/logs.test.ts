import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close() {}
}

// @ts-expect-error - Mocking EventSource for tests
global.EventSource = MockEventSource;

describe('Logs API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('gets logs for a run', async () => {
    const mockLogs = {
      run_id: 'run-1',
      data: 'Training started...',
      size: 100,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLogs),
    });

    const { logsApi } = await import('@/lib/api/modules/logs');
    const result = await logsApi.getLogs('run-1');

    expect(result).toEqual(mockLogs);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/runs/run-1/logs'),
      expect.any(Object)
    );
  });

  it('creates a log stream EventSource', async () => {
    const { logsApi } = await import('@/lib/api/modules/logs');
    const eventSource = logsApi.createLogStream('run-1');

    expect(eventSource).toBeInstanceOf(MockEventSource);
    expect(eventSource.url).toContain('/runs/run-1/logs/stream');
  });

  it('parses log SSE event', async () => {
    const { logsApi } = await import('@/lib/api/modules/logs');
    const event = new MessageEvent('log', {
      data: JSON.stringify({ content: 'Training epoch 1' }),
    });

    const result = logsApi.parseSSEEvent(event, 'log');

    expect(result).toEqual({
      type: 'log',
      data: { content: 'Training epoch 1' },
    });
  });

  it('parses heartbeat SSE event', async () => {
    const { logsApi } = await import('@/lib/api/modules/logs');
    const event = new MessageEvent('heartbeat', {
      data: JSON.stringify({ timestamp: 12345 }),
    });

    const result = logsApi.parseSSEEvent(event, 'heartbeat');

    expect(result).toEqual({
      type: 'heartbeat',
      data: { timestamp: 12345 },
    });
  });

  it('parses done SSE event', async () => {
    const { logsApi } = await import('@/lib/api/modules/logs');
    const event = new MessageEvent('done', {
      data: JSON.stringify({ final_size: 1000 }),
    });

    const result = logsApi.parseSSEEvent(event, 'done');

    expect(result).toEqual({
      type: 'done',
      data: { final_size: 1000 },
    });
  });

  it('returns null for unknown SSE event type', async () => {
    const { logsApi } = await import('@/lib/api/modules/logs');
    const event = new MessageEvent('unknown', {
      data: JSON.stringify({ foo: 'bar' }),
    });

    const result = logsApi.parseSSEEvent(event, 'unknown');

    expect(result).toBeNull();
  });

  it('handles invalid JSON in SSE event', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { logsApi } = await import('@/lib/api/modules/logs');
    const event = new MessageEvent('log', {
      data: 'invalid json',
    });

    const result = logsApi.parseSSEEvent(event, 'log');

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});
