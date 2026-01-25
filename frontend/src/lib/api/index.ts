/**
 * Text2Song Studio API Client
 * 
 * This module provides a modular, clean architecture API client.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { promptsApi, feedbackApi, adaptersApi } from '@/lib/api';
 * 
 * const prompt = await promptsApi.create({ text: 'A cheerful melody' });
 * const feedback = await feedbackApi.list({ min_rating: 4 });
 * const adapters = await adaptersApi.list({ activeOnly: true });
 * ```
 * 
 * ## Available Modules
 * - `promptsApi` - Prompt management
 * - `audioApi` - Audio streaming and metadata
 * - `generationApi` - Generation jobs and status
 * - `feedbackApi` - User feedback collection
 * - `adaptersApi` - LoRA adapter management
 * - `datasetsApi` - Training dataset management
 * - `experimentsApi` - Experiment tracking
 * - `abTestsApi` - A/B testing
 * - `metricsApi` - Dashboard metrics
 */

// Re-export client utilities
export { API_BASE, fetchApi, buildQueryString, ApiError } from './client';

// Re-export all types
export * from './types';

// Re-export modular APIs
export {
  promptsApi,
  audioApi,
  generationApi,
  feedbackApi,
  adaptersApi,
  datasetsApi,
  experimentsApi,
  abTestsApi,
  metricsApi,
} from './modules';
