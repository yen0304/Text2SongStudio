/**
 * Logs API Module
 *
 * Handles training log retrieval and streaming
 */

import { fetchApi, API_BASE } from '../client';
import type { TrainingLogResponse, SSEEvent } from '../types/logs';

export const logsApi = {
  /**
   * Get full training log history for a run
   */
  getLogs: (runId: string) =>
    fetchApi<TrainingLogResponse>(`/runs/${runId}/logs`),

  /**
   * Create an EventSource for streaming logs
   * Returns an EventSource that emits log, heartbeat, and done events
   */
  createLogStream: (runId: string): EventSource => {
    const url = `${API_BASE}/runs/${runId}/logs/stream`;
    return new EventSource(url);
  },

  /**
   * Parse an SSE event from the log stream
   */
  parseSSEEvent: (event: MessageEvent, eventType: string): SSEEvent | null => {
    try {
      const data = JSON.parse(event.data);

      switch (eventType) {
        case 'log':
          return { type: 'log', data };
        case 'heartbeat':
          return { type: 'heartbeat', data };
        case 'done':
          return { type: 'done', data };
        default:
          return null;
      }
    } catch (e) {
      console.error('[LogsAPI] Failed to parse SSE event:', e);
      return null;
    }
  },
};
