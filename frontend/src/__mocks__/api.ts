import { vi } from 'vitest';
import type {
  Prompt,
  AudioSample,
  GenerationJob,
  Adapter,
  Dataset,
  DatasetExport,
  DatasetStats,
  QualityRating,
  PreferencePair,
  AudioTag,
  RatingStats,
  PreferenceStats,
  TagStats,
} from '@/lib/api';
import type { JobFeedbackResponse } from '@/lib/api/types/generation';

// Mock data factories
export const createMockAdapter = (overrides?: Partial<Adapter>): Adapter => ({
  id: 'adapter-1',
  name: 'Test Adapter',
  description: 'A test adapter',
  base_model: 'facebook/musicgen-small',
  base_model_config: null,
  status: 'active',
  current_version: '1.0.0',
  config: {},
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
  ...overrides,
});

export const createMockDataset = (overrides?: Partial<Dataset>): Dataset => ({
  id: 'dataset-1',
  name: 'Test Dataset',
  description: 'A test dataset',
  type: 'supervised',
  filter_query: {},
  sample_count: 100,
  export_path: null,
  is_exported: false,
  created_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
});

export const createMockPrompt = (overrides?: Partial<Prompt>): Prompt => ({
  id: 'prompt-1',
  text: 'A cheerful piano melody',
  attributes: { style: 'classical', tempo: 120 },
  instruments: ['piano'],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockRating = (overrides?: Partial<QualityRating>): QualityRating => ({
  id: 'rating-1',
  audio_id: 'audio-1',
  user_id: null,
  rating: 4,
  criterion: 'overall',
  notes: 'Nice melody',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPreference = (overrides?: Partial<PreferencePair>): PreferencePair => ({
  id: 'preference-1',
  prompt_id: 'prompt-1',
  chosen_audio_id: 'audio-1',
  rejected_audio_id: 'audio-2',
  user_id: null,
  margin: null,
  notes: 'Better rhythm',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTag = (overrides?: Partial<AudioTag>): AudioTag => ({
  id: 'tag-1',
  audio_id: 'audio-1',
  user_id: null,
  tag: 'good_melody',
  is_positive: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// =====================
// Modular Mock APIs
// =====================

/** Mock Prompts API */
export const mockPromptsApi = {
  create: vi.fn().mockResolvedValue(createMockPrompt()),
  get: vi.fn().mockResolvedValue(createMockPrompt()),
  list: vi.fn().mockResolvedValue({ items: [createMockPrompt()], total: 1 }),
};

/** Mock Audio API */
export const mockAudioApi = {
  getMetadata: vi.fn().mockResolvedValue({
    id: 'audio-1',
    prompt_id: 'prompt-1',
    adapter_id: null,
    duration_seconds: 10,
    sample_rate: 44100,
    created_at: '2024-01-01T00:00:00Z',
  } as AudioSample),
  getStreamUrl: vi.fn((id: string) => `http://localhost:8000/audio/${id}/stream`),
};

/** Mock Generation API */
export const mockGenerationApi = {
  submit: vi.fn().mockResolvedValue({ id: 'job-1', status: 'queued' } as GenerationJob),
  getStatus: vi.fn().mockResolvedValue({ id: 'job-1', status: 'completed', audio_ids: ['audio-1'] } as GenerationJob),
  getJobFeedback: vi.fn().mockResolvedValue({
    job_id: 'job-1',
    prompt_id: 'prompt-1',
    total_samples: 1,
    total_feedback: 1,
    average_rating: 4,
    samples: [],
  } as JobFeedbackResponse),
  cancel: vi.fn().mockResolvedValue(undefined),
  listJobs: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 }),
  getJobStats: vi.fn().mockResolvedValue({
    status_counts: { completed: 80, processing: 5, queued: 10, failed: 5 },
    active_jobs: 15,
    avg_processing_time_seconds: 30,
    jobs_today: 20,
    total_jobs: 100,
  }),
  getJob: vi.fn().mockResolvedValue(null),
  deleteJob: vi.fn().mockResolvedValue({ status: 'deleted', job_id: 'job-1' }),
};

/** Mock Ratings API (SFT Training) */
export const mockRatingsApi = {
  submit: vi.fn().mockResolvedValue(createMockRating()),
  get: vi.fn().mockResolvedValue(createMockRating()),
  list: vi.fn().mockResolvedValue({ items: [createMockRating()], total: 1 }),
  getForAudio: vi.fn().mockResolvedValue({ items: [createMockRating()], total: 1 }),
  delete: vi.fn().mockResolvedValue({ status: 'deleted', id: 'rating-1' }),
  getStats: vi.fn().mockResolvedValue({
    audio_id: null,
    total_ratings: 100,
    average_rating: 3.8,
    rating_by_criterion: {
      overall: 3.8,
      melody: 4.0,
      rhythm: 3.5,
      harmony: 3.7,
      coherence: 3.9,
      creativity: 4.1,
      adherence: 3.6,
    },
    rating_distribution: { 1: 10, 2: 15, 3: 25, 4: 30, 5: 20 },
  } as RatingStats),
};

/** Mock Preferences API (DPO/RLHF Training) */
export const mockPreferencesApi = {
  submit: vi.fn().mockResolvedValue(createMockPreference()),
  get: vi.fn().mockResolvedValue(createMockPreference()),
  list: vi.fn().mockResolvedValue({ items: [createMockPreference()], total: 1 }),
  getForPrompt: vi.fn().mockResolvedValue({ items: [createMockPreference()], total: 1 }),
  delete: vi.fn().mockResolvedValue({ status: 'deleted', id: 'preference-1' }),
  getStats: vi.fn().mockResolvedValue({
    total_pairs: 50,
    unique_prompts: 30,
    unique_audios: 20,
    average_margin: 2.5,
    audio_win_rates: null,
  } as PreferenceStats),
};

/** Mock Tags API */
export const mockTagsApi = {
  add: vi.fn().mockResolvedValue(createMockTag()),
  addBulk: vi.fn().mockResolvedValue({ created: 3 }),
  remove: vi.fn().mockResolvedValue({ status: 'deleted' }),
  getForAudio: vi.fn().mockResolvedValue({ items: [createMockTag()], total: 1 }),
  update: vi.fn().mockResolvedValue({ tags: ['good_melody'] }),
  getAvailable: vi.fn().mockResolvedValue({
    positive: ['good_melody', 'creative'],
    negative: ['distorted', 'repetitive'],
    all: ['good_melody', 'creative', 'distorted', 'repetitive'],
  }),
  getStats: vi.fn().mockResolvedValue({
    total_tags: 100,
    positive_count: 60,
    negative_count: 40,
    tag_frequency: { good_melody: 40, creative: 30 },
    top_positive_tags: [['good_melody', 40], ['creative', 30]],
    top_negative_tags: [['distorted', 20], ['repetitive', 15]],
  } as TagStats),
};

/** Mock Adapters API */
export const mockAdaptersApi = {
  list: vi.fn().mockResolvedValue({ items: [createMockAdapter()], total: 1 }),
  getStats: vi.fn().mockResolvedValue({ total: 5, active: 3, archived: 2, total_versions: 10 }),
  get: vi.fn().mockResolvedValue(createMockAdapter()),
  getTimeline: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(createMockAdapter()),
  update: vi.fn().mockResolvedValue(createMockAdapter()),
  delete: vi.fn().mockResolvedValue({ status: 'deleted', adapter_id: 'adapter-1' }),
  createVersion: vi.fn().mockResolvedValue(null),
  activateVersion: vi.fn().mockResolvedValue({ status: 'activated', version: '1.0.0' }),
};

/** Mock Datasets API */
export const mockDatasetsApi = {
  list: vi.fn().mockResolvedValue({ items: [createMockDataset()], total: 1 }),
  get: vi.fn().mockResolvedValue(createMockDataset()),
  create: vi.fn().mockResolvedValue(createMockDataset()),
  export: vi.fn().mockResolvedValue({
    dataset_id: 'dataset-1',
    export_path: '/exports/dataset-1',
    sample_count: 100,
    format: 'jsonl',
  } as DatasetExport),
  getStats: vi.fn().mockResolvedValue({
    dataset_id: 'dataset-1',
    sample_count: 100,
    total_samples: 200,
    rating_distribution: { 1: 10, 2: 20, 3: 30, 4: 25, 5: 15 },
    unique_prompts: 50,
    unique_adapters: 3,
    tag_frequency: { good_melody: 40, creative: 30 },
    avg_rating: 3.5,
  } as DatasetStats),
  previewCount: vi.fn().mockResolvedValue({ count: 50 }),
};

/** Mock Experiments API */
export const mockExperimentsApi = {
  list: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 }),
  get: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(null),
  update: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(undefined),
  createRun: vi.fn().mockResolvedValue(null),
  getMetrics: vi.fn().mockResolvedValue(null),
};

/** Mock A/B Tests API */
export const mockAbTestsApi = {
  list: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 }),
  get: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(null),
  generateSamples: vi.fn().mockResolvedValue(null),
  submitVote: vi.fn().mockResolvedValue(null),
  getResults: vi.fn().mockResolvedValue(null),
};

/** Mock Metrics API */
export const mockMetricsApi = {
  getOverview: vi.fn().mockResolvedValue({
    pipeline: {
      generation: { total: 100, completed: 80, active: 5 },
      feedback: { total: 200, rated_samples: 150, pending: 50 },
      dataset: { total: 10, exported: 5 },
      training: { total: 5, running: 1 },
    },
    quick_stats: {
      total_generations: 100,
      total_samples: 500,
      avg_rating: 3.8,
      active_adapters: 3,
      total_adapters: 5,
      pending_feedback: 50,
    },
  }),
  getFeedback: vi.fn().mockResolvedValue({
    rating_distribution: { 1: 10, 2: 15, 3: 25, 4: 30, 5: 20 },
    by_adapter: [{ adapter_id: 'adapter-1', adapter_name: 'Test', count: 50, avg_rating: 4.0 }],
    preference_comparisons: 30,
    tagged_feedback: 60,
  }),
};

// Export modular APIs
export const promptsApi = mockPromptsApi;
export const audioApi = mockAudioApi;
export const generationApi = mockGenerationApi;
export const ratingsApi = mockRatingsApi;
export const preferencesApi = mockPreferencesApi;
export const tagsApi = mockTagsApi;
export const adaptersApi = mockAdaptersApi;
export const datasetsApi = mockDatasetsApi;
export const experimentsApi = mockExperimentsApi;
export const abTestsApi = mockAbTestsApi;
export const metricsApi = mockMetricsApi;

/** Helper to reset all modular mocks */
export function resetModularMocks() {
  const allMocks = [
    mockPromptsApi,
    mockAudioApi,
    mockGenerationApi,
    mockRatingsApi,
    mockPreferencesApi,
    mockTagsApi,
    mockAdaptersApi,
    mockDatasetsApi,
    mockExperimentsApi,
    mockAbTestsApi,
    mockMetricsApi,
  ];
  
  allMocks.forEach(mockModule => {
    Object.values(mockModule).forEach((mock) => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        mock.mockClear();
      }
    });
  });
}

/** Helper to reset all mocks */
export const resetApiMocks = resetModularMocks;
