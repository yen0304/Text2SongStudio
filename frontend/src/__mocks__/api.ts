import { vi } from 'vitest';
import type {
  Prompt,
  AudioSample,
  GenerationJob,
  Feedback,
  Adapter,
  Dataset,
  DatasetExport,
  DatasetStats,
  FeedbackStats,
  FeedbackListResponse,
  JobFeedbackResponse,
} from '@/lib/api';

// Mock data factories
export const createMockAdapter = (overrides?: Partial<Adapter>): Adapter => ({
  id: 'adapter-1',
  name: 'Test Adapter',
  description: 'A test adapter',
  base_model: 'facebook/musicgen-small',
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

export const createMockFeedback = (overrides?: Partial<Feedback>): Feedback => ({
  id: 'feedback-1',
  audio_id: 'audio-1',
  rating: 4,
  rating_criterion: 'overall',
  preferred_over: undefined,
  tags: ['good_melody'],
  notes: 'Nice melody',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock API object
export const mockApi = {
  // Prompts
  createPrompt: vi.fn().mockResolvedValue(createMockPrompt()),
  getPrompt: vi.fn().mockResolvedValue(createMockPrompt()),
  listPrompts: vi.fn().mockResolvedValue({ items: [createMockPrompt()], total: 1 }),

  // Generation
  submitGeneration: vi.fn().mockResolvedValue({ id: 'job-1', status: 'queued' } as GenerationJob),
  getJobStatus: vi.fn().mockResolvedValue({ id: 'job-1', status: 'completed', audio_ids: ['audio-1'] } as GenerationJob),
  getJobFeedback: vi.fn().mockResolvedValue({
    job_id: 'job-1',
    prompt_id: 'prompt-1',
    total_samples: 1,
    total_feedback: 1,
    average_rating: 4,
    samples: [],
  } as JobFeedbackResponse),
  cancelJob: vi.fn().mockResolvedValue(undefined),

  // Audio
  getAudioMetadata: vi.fn().mockResolvedValue({
    id: 'audio-1',
    prompt_id: 'prompt-1',
    adapter_id: null,
    duration_seconds: 10,
    sample_rate: 44100,
    created_at: '2024-01-01T00:00:00Z',
  } as AudioSample),
  getAudioStreamUrl: vi.fn((id: string) => `http://localhost:8000/audio/${id}/stream`),

  // Feedback
  submitFeedback: vi.fn().mockResolvedValue(createMockFeedback()),
  getFeedback: vi.fn().mockResolvedValue([createMockFeedback()]),
  listFeedback: vi.fn().mockResolvedValue({ items: [createMockFeedback()], total: 1 } as FeedbackListResponse),

  // Adapters
  listAdapters: vi.fn().mockResolvedValue({ items: [createMockAdapter()], total: 1 }),
  getAdapter: vi.fn().mockResolvedValue(createMockAdapter()),
  activateAdapter: vi.fn().mockResolvedValue(createMockAdapter({ is_active: true })),
  deactivateAdapter: vi.fn().mockResolvedValue(createMockAdapter({ is_active: false })),

  // Datasets
  listDatasets: vi.fn().mockResolvedValue({ items: [createMockDataset()], total: 1 }),
  getDataset: vi.fn().mockResolvedValue(createMockDataset()),
  createDataset: vi.fn().mockResolvedValue(createMockDataset()),
  exportDataset: vi.fn().mockResolvedValue({
    dataset_id: 'dataset-1',
    export_path: '/exports/dataset-1',
    sample_count: 100,
    format: 'jsonl',
  } as DatasetExport),
  getDatasetStats: vi.fn().mockResolvedValue({
    dataset_id: 'dataset-1',
    sample_count: 100,
    total_samples: 200,
    rating_distribution: { 1: 10, 2: 20, 3: 30, 4: 25, 5: 15 },
    unique_prompts: 50,
    unique_adapters: 3,
    tag_frequency: { good_melody: 40, creative: 30 },
    avg_rating: 3.5,
  } as DatasetStats),
  previewDatasetCount: vi.fn().mockResolvedValue({ count: 50 }),

  // Feedback Stats
  getFeedbackStats: vi.fn().mockResolvedValue({
    total_feedback: 100,
    total_ratings: 80,
    total_preferences: 20,
    rating_distribution: { 1: 10, 2: 15, 3: 25, 4: 30, 5: 20 },
    high_rated_samples: 50,
  } as FeedbackStats),

  // Overview Metrics
  getOverviewMetrics: vi.fn().mockResolvedValue({
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
  getFeedbackMetrics: vi.fn().mockResolvedValue({
    rating_distribution: { 1: 10, 2: 15, 3: 25, 4: 30, 5: 20 },
    by_adapter: [{ adapter_id: 'adapter-1', adapter_name: 'Test', count: 50, avg_rating: 4.0 }],
    preference_comparisons: 30,
    tagged_feedback: 60,
  }),

  // Jobs
  listJobs: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
  }),
  getJobStats: vi.fn().mockResolvedValue({
    status_counts: { completed: 80, processing: 5, queued: 10, failed: 5 },
    active_jobs: 15,
    avg_processing_time_seconds: 30,
    jobs_today: 20,
    total_jobs: 100,
  }),

  // Experiments
  listExperiments: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 }),
  getExperiment: vi.fn().mockResolvedValue(null),
  createExperiment: vi.fn().mockResolvedValue(null),
  updateExperiment: vi.fn().mockResolvedValue(null),
  deleteExperiment: vi.fn().mockResolvedValue(undefined),
  createExperimentRun: vi.fn().mockResolvedValue(null),
  getExperimentMetrics: vi.fn().mockResolvedValue(null),

  // A/B Tests
  listABTests: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 }),
  getABTest: vi.fn().mockResolvedValue(null),
  createABTest: vi.fn().mockResolvedValue(null),
  generateABTestSamples: vi.fn().mockResolvedValue(null),
  submitABTestVote: vi.fn().mockResolvedValue(null),
  getABTestResults: vi.fn().mockResolvedValue(null),

  // V2 Adapters
  listAdaptersV2: vi.fn().mockResolvedValue([]),
  getAdapterStats: vi.fn().mockResolvedValue({ total: 0, active: 0, archived: 0, total_versions: 0 }),
  getAdapterV2: vi.fn().mockResolvedValue(null),
  getAdapterTimeline: vi.fn().mockResolvedValue(null),
  createAdapterV2: vi.fn().mockResolvedValue(null),
  updateAdapterV2: vi.fn().mockResolvedValue(null),
  deleteAdapterV2: vi.fn().mockResolvedValue(undefined),
  createAdapterVersion: vi.fn().mockResolvedValue(null),
  activateAdapterVersion: vi.fn().mockResolvedValue(null),
};

// Helper to reset all mocks
export function resetApiMocks() {
  Object.values(mockApi).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
}

// Export for use in tests
export const api = mockApi;
