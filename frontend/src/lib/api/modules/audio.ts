/**
 * Audio API Module
 * 
 * Handles all audio-related API operations
 */

import { fetchApi, API_BASE } from '../client';
import type { AudioSample } from '../types/audio';

export const audioApi = {
  /**
   * Get audio metadata
   */
  getMetadata: (id: string) => 
    fetchApi<AudioSample>(`/audio/${id}`),

  /**
   * Get streaming URL for audio playback
   */
  getStreamUrl: (id: string) => 
    `${API_BASE}/audio/${id}/stream`,
};
