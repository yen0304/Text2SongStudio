/**
 * Models API module
 *
 * Provides access to model configuration and capabilities.
 */

import { fetchApi, API_BASE } from '../client';
import type { ModelConfig, ModelsListResponse, ModelSwitchResponse, ModelSwitchProgressEvent } from '../types/models';

export const modelsApi = {
  /**
   * List all available models with their capabilities
   */
  async list(): Promise<ModelsListResponse> {
    return fetchApi<ModelsListResponse>('/models');
  },

  /**
   * Get the currently active model configuration
   */
  async getCurrent(): Promise<ModelConfig> {
    return fetchApi<ModelConfig>('/models/current');
  },

  /**
   * Switch to a different model
   */
  async switchModel(modelId: string): Promise<ModelSwitchResponse> {
    return fetchApi<ModelSwitchResponse>('/models/switch', {
      method: 'POST',
      body: JSON.stringify({ model_id: modelId }),
    });
  },

  /**
   * Switch to a different model with progress streaming
   * @param modelId - The ID of the model to switch to
   * @param onProgress - Callback for progress events
   * @returns Promise that resolves when switch is complete
   */
  async switchModelStream(
    modelId: string,
    onProgress: (event: ModelSwitchProgressEvent) => void
  ): Promise<ModelSwitchProgressEvent> {
    const response = await fetch(`${API_BASE}/models/switch/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_id: modelId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to switch model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let lastEvent: ModelSwitchProgressEvent | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = 'status';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as ModelSwitchProgressEvent;
            lastEvent = data;
            onProgress(data);

            if (data.event === 'done' || data.event === 'error') {
              return data;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Stream ended unexpectedly without a 'done' or 'error' event
    // This is an error condition - the model switch may not have completed
    if (lastEvent && (lastEvent.event === 'done' || lastEvent.event === 'error')) {
      return lastEvent;
    }

    throw new Error('Stream ended unexpectedly without completion event');
  },
};
