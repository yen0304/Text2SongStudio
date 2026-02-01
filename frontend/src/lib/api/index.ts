/**
 * Text2Song Studio API Client
 * 
 * This module provides a modular, clean architecture API client.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { promptsApi, ratingsApi, preferencesApi, tagsApi } from '@/lib/api';
 * 
 * const prompt = await promptsApi.create({ text: 'A cheerful melody' });
 * const ratings = await ratingsApi.list({ min_rating: 4 });
 * const preferences = await preferencesApi.getForPrompt(promptId);
 * const tags = await tagsApi.getForAudio(audioId);
 * ```
 * 
 * ## Available Modules
 * - `promptsApi` - Prompt management
 * - `audioApi` - Audio streaming and metadata
 * - `generationApi` - Generation jobs and status
 * - `ratingsApi` - Quality ratings (SFT training)
 * - `preferencesApi` - Preference pairs (DPO/RLHF training)
 * - `tagsApi` - Audio tagging and categorization
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
  ratingsApi,
  preferencesApi,
  tagsApi,
  adaptersApi,
  datasetsApi,
  experimentsApi,
  abTestsApi,
  metricsApi,
  modelsApi,
  templatesApi,
  favoritesApi,
} from './modules';
