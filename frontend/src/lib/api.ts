const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Prompt {
  id: string;
  text: string;
  attributes: PromptAttributes;
  instruments?: string[];
  created_at: string;
}

export interface PromptAttributes {
  style?: string;
  tempo?: number;
  primary_instruments?: string[];
  secondary_instruments?: string[];
  mood?: string;
  duration?: number;
}

export interface AudioSample {
  id: string;
  prompt_id: string;
  adapter_id: string | null;
  duration_seconds: number;
  sample_rate: number;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  audio_ids?: string[];
  error?: string;
}

export interface Feedback {
  id: string;
  audio_id: string;
  rating?: number;
  rating_criterion?: string;
  preferred_over?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
}

// Job Feedback types
export interface SampleFeedbackItem {
  id: string;
  rating: number | null;
  rating_criterion: string | null;
  preferred_over: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
}

export interface SampleFeedbackGroup {
  audio_id: string;
  label: string;
  feedback: SampleFeedbackItem[];
  average_rating: number | null;
  feedback_count: number;
}

export interface JobFeedbackResponse {
  job_id: string;
  prompt_id: string;
  total_samples: number;
  total_feedback: number;
  average_rating: number | null;
  samples: SampleFeedbackGroup[];
}

export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
}

export interface Adapter {
  id: string;
  name: string;
  version: string;
  description: string;
  base_model: string;
  storage_path: string;
  training_dataset_id: string | null;
  training_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'supervised' | 'preference';
  filter_query: FilterQuery;
  sample_count: number;
  export_path: string | null;
  is_exported: boolean;
  created_at: string;
}

export interface FilterQuery {
  min_rating?: number;
  max_rating?: number;
  required_tags?: string[];
  excluded_tags?: string[];
  adapter_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface DatasetCreate {
  name: string;
  description?: string;
  type: 'supervised' | 'preference';
  filter_query?: FilterQuery;
}

export interface DatasetExport {
  dataset_id: string;
  export_path: string;
  sample_count: number;
  format: string;
}

export interface DatasetStats {
  dataset_id: string;
  sample_count: number;
  total_samples: number;
  rating_distribution: Record<number, number>;
  unique_prompts: number;
  unique_adapters: number;
  tag_frequency: Record<string, number>;
  avg_rating: number | null;
  inter_rater_agreement?: number;
  preference_consistency?: number;
}

export interface FeedbackStats {
  total_feedback: number;
  total_ratings: number;
  total_preferences: number;
  rating_distribution: Record<number, number>;
  high_rated_samples: number;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`[API] ${options?.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`[API] Error ${response.status}:`, error);
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Response:`, data);
    return data;
  } catch (err) {
    console.error(`[API] Request failed:`, err);
    throw err;
  }
}

export const api = {
  // Prompts
  createPrompt: (data: { text: string; attributes?: PromptAttributes }) =>
    fetchApi<Prompt>('/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPrompt: (id: string) => fetchApi<Prompt>(`/prompts/${id}`),

  listPrompts: (page = 1, limit = 20) =>
    fetchApi<{ items: Prompt[]; total: number }>(`/prompts?page=${page}&limit=${limit}`),

  // Generation
  submitGeneration: (data: {
    prompt_id: string;
    num_samples?: number;
    adapter_id?: string;
  }) =>
    fetchApi<GenerationJob>('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getJobStatus: (jobId: string) => fetchApi<GenerationJob>(`/generate/${jobId}`),

  getJobFeedback: (jobId: string) => fetchApi<JobFeedbackResponse>(`/generate/${jobId}/feedback`),

  cancelJob: (jobId: string) =>
    fetchApi<void>(`/generate/${jobId}`, { method: 'DELETE' }),

  // Audio
  getAudioMetadata: (id: string) => fetchApi<AudioSample>(`/audio/${id}`),

  getAudioStreamUrl: (id: string) => `${API_BASE}/audio/${id}/stream`,

  // Feedback
  submitFeedback: (data: {
    audio_id: string;
    rating?: number;
    preferred_over?: string;
    tags?: string[];
    notes?: string;
  }) =>
    fetchApi<Feedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFeedback: (audioId?: string) =>
    fetchApi<Feedback[]>(`/feedback${audioId ? `?audio_id=${audioId}` : ''}`),

  listFeedback: (params?: {
    audio_id?: string;
    job_id?: string;
    min_rating?: number;
    max_rating?: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.audio_id) searchParams.set('audio_id', params.audio_id);
    if (params?.job_id) searchParams.set('job_id', params.job_id);
    if (params?.min_rating) searchParams.set('min_rating', params.min_rating.toString());
    if (params?.max_rating) searchParams.set('max_rating', params.max_rating.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<FeedbackListResponse>(`/feedback${query ? `?${query}` : ''}`);
  },

  // Adapters
  listAdapters: async (activeOnly = false) => {
    const params = activeOnly ? '?active_only=true' : '';
    const response = await fetchApi<{ items: Adapter[]; total: number }>(`/adapters${params}`);
    return response;
  },

  getAdapter: (id: string) => fetchApi<Adapter>(`/adapters/${id}`),

  activateAdapter: (id: string) =>
    fetchApi<Adapter>(`/adapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    }),

  deactivateAdapter: (id: string) =>
    fetchApi<Adapter>(`/adapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    }),

  // Datasets
  listDatasets: (page = 1, limit = 20) =>
    fetchApi<{ items: Dataset[]; total: number }>(`/datasets?page=${page}&limit=${limit}`),

  getDataset: (id: string) => fetchApi<Dataset>(`/datasets/${id}`),

  createDataset: (data: DatasetCreate) =>
    fetchApi<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  exportDataset: (id: string, format: 'jsonl' | 'huggingface' = 'jsonl', outputPath?: string) =>
    fetchApi<DatasetExport>(`/datasets/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ format, output_path: outputPath }),
    }),

  getDatasetStats: (id: string) => fetchApi<DatasetStats>(`/datasets/${id}/stats`),

  previewDatasetCount: (type: 'supervised' | 'preference', filterQuery?: FilterQuery) =>
    fetchApi<{ count: number }>('/datasets/preview', {
      method: 'POST',
      body: JSON.stringify({ type, filter_query: filterQuery }),
    }),

  // Feedback Stats
  getFeedbackStats: () => fetchApi<FeedbackStats>('/feedback/summary'),

  // Overview Metrics
  getOverviewMetrics: () =>
    fetchApi<{
      pipeline: {
        generation: { total: number; completed: number; active: number };
        feedback: { total: number; rated_samples: number; pending: number };
        dataset: { total: number; exported: number };
        training: { total: number; running: number };
      };
      quick_stats: {
        total_generations: number;
        total_samples: number;
        avg_rating: number | null;
        active_adapters: number;
        total_adapters: number;
        pending_feedback: number;
      };
    }>('/metrics/overview'),

  getFeedbackMetrics: () =>
    fetchApi<{
      rating_distribution: Record<number, number>;
      by_adapter: { adapter_id: string | null; adapter_name: string; count: number; avg_rating: number | null }[];
      preference_comparisons: number;
      tagged_feedback: number;
    }>('/metrics/feedback'),

  // Jobs
  listJobs: (params?: {
    status?: string;
    adapter_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.adapter_id) searchParams.set('adapter_id', params.adapter_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{
      items: {
        id: string;
        prompt_id: string | null;
        prompt_preview: string | null;
        adapter_id: string | null;
        adapter_name: string | null;
        status: string;
        progress: number;
        num_samples: number;
        audio_ids: string[];
        error: string | null;
        duration_seconds: number | null;
        created_at: string;
        completed_at: string | null;
      }[];
      total: number;
      limit: number;
      offset: number;
    }>(`/jobs${query ? `?${query}` : ''}`);
  },

  getJobStats: () =>
    fetchApi<{
      status_counts: Record<string, number>;
      active_jobs: number;
      avg_processing_time_seconds: number | null;
      jobs_today: number;
      total_jobs: number;
    }>('/jobs/stats'),

  // Experiments
  listExperiments: (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{
      items: Experiment[];
      total: number;
      limit: number;
      offset: number;
    }>(`/experiments${query ? `?${query}` : ''}`);
  },

  getExperiment: (id: string) =>
    fetchApi<ExperimentDetail>(`/experiments/${id}`),

  createExperiment: (data: { name: string; description?: string; dataset_id?: string; config?: Record<string, unknown> }) =>
    fetchApi<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExperiment: (id: string, data: { name?: string; description?: string; config?: Record<string, unknown> }) =>
    fetchApi<Experiment>(`/experiments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExperiment: (id: string) =>
    fetchApi<void>(`/experiments/${id}`, { method: 'DELETE' }),

  createExperimentRun: (experimentId: string, data?: { name?: string; config?: Record<string, unknown> }) =>
    fetchApi<ExperimentRun>(`/experiments/${experimentId}/runs`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  getExperimentMetrics: (experimentId: string) =>
    fetchApi<{
      experiment_id: string;
      run_count: number;
      runs: { id: string; name: string; final_loss: number | null; metrics: Record<string, unknown>; adapter_id: string | null }[];
      best_loss: number | null;
      best_run_id: string | null;
    }>(`/experiments/${experimentId}/metrics`),

  // A/B Tests
  listABTests: (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{
      items: ABTest[];
      total: number;
      limit: number;
      offset: number;
    }>(`/ab-tests${query ? `?${query}` : ''}`);
  },

  getABTest: (id: string) =>
    fetchApi<ABTestDetail>(`/ab-tests/${id}`),

  createABTest: (data: { name: string; description?: string; adapter_a_id?: string; adapter_b_id?: string; prompt_ids: string[] }) =>
    fetchApi<ABTest>('/ab-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateABTestSamples: (testId: string, data?: { prompt_ids?: string[]; samples_per_prompt?: number }) =>
    fetchApi<ABTest>(`/ab-tests/${testId}/generate`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  submitABTestVote: (testId: string, pairId: string, preference: 'a' | 'b' | 'equal') =>
    fetchApi<ABTestPair>(`/ab-tests/${testId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ pair_id: pairId, preference }),
    }),

  getABTestResults: (testId: string) =>
    fetchApi<ABTestResults>(`/ab-tests/${testId}/results`),

  // Enhanced Adapters (v2 API)
  listAdaptersV2: (params?: { status?: string; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<AdapterV2[]>(`/api/v2/adapters${query ? `?${query}` : ''}`);
  },

  getAdapterStats: () =>
    fetchApi<{
      total: number;
      active: number;
      archived: number;
      total_versions: number;
    }>('/api/v2/adapters/stats'),

  getAdapterV2: (id: string) =>
    fetchApi<AdapterDetailV2>(`/api/v2/adapters/${id}`),

  getAdapterTimeline: (id: string) =>
    fetchApi<AdapterTimeline>(`/api/v2/adapters/${id}/timeline`),

  createAdapterV2: (data: { name: string; description?: string; base_model?: string; config?: Record<string, unknown> }) =>
    fetchApi<AdapterV2>('/api/v2/adapters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAdapterV2: (id: string, data: { name?: string; description?: string; status?: string; config?: Record<string, unknown> }) =>
    fetchApi<AdapterV2>(`/api/v2/adapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAdapterV2: (id: string) =>
    fetchApi<void>(`/api/v2/adapters/${id}`, { method: 'DELETE' }),

  createAdapterVersion: (adapterId: string, data: { version: string; description?: string }) =>
    fetchApi<AdapterVersionV2>(`/api/v2/adapters/${adapterId}/versions?version=${encodeURIComponent(data.version)}${data.description ? `&description=${encodeURIComponent(data.description)}` : ''}`, {
      method: 'POST',
    }),

  activateAdapterVersion: (adapterId: string, versionId: string) =>
    fetchApi<{ status: string; version: string }>(`/api/v2/adapters/${adapterId}/versions/${versionId}/activate`, {
      method: 'PATCH',
    }),
};

// Enhanced Adapter types (v2 API)
export interface AdapterV2 {
  id: string;
  name: string;
  description: string | null;
  base_model: string;
  status: 'active' | 'archived';
  current_version: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdapterVersionV2 {
  id: string;
  adapter_id: string;
  version: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdapterDetailV2 extends AdapterV2 {
  versions: AdapterVersionV2[];
}

export interface AdapterTimelineEvent {
  id: string;
  type: 'created' | 'version' | 'training';
  timestamp: string;
  title: string;
  description: string | null;
  metadata: {
    adapter_id?: string;
    version_id?: string;
    version?: string;
    is_active?: boolean;
    run_id?: string;
    status?: string;
    final_loss?: number | null;
  } | null;
}

export interface AdapterTimeline {
  adapter_id: string;
  adapter_name: string;
  events: AdapterTimelineEvent[];
  total_versions: number;
  total_training_runs: number;
}

// Additional types for new endpoints
export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  dataset_id: string | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  config: Record<string, unknown> | null;
  best_run_id: string | null;
  best_loss: number | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExperimentRun {
  id: string;
  experiment_id: string;
  adapter_id: string | null;
  name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  final_loss: number | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExperimentDetail extends Experiment {
  runs: ExperimentRun[];
}

export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  adapter_a_id: string | null;
  adapter_b_id: string | null;
  adapter_a_name: string | null;
  adapter_b_name: string | null;
  status: 'draft' | 'generating' | 'active' | 'completed';
  total_pairs: number;
  completed_pairs: number;
  results: { a_preferred: number; b_preferred: number; equal: number } | null;
  created_at: string;
  updated_at: string;
}

export interface ABTestPair {
  id: string;
  prompt_id: string;
  audio_a_id: string | null;
  audio_b_id: string | null;
  preference: 'a' | 'b' | 'equal' | null;
  voted_at: string | null;
  is_ready: boolean;
}

export interface ABTestDetail extends ABTest {
  pairs: ABTestPair[];
}

export interface ABTestResults {
  id: string;
  name: string;
  adapter_a_name: string | null;
  adapter_b_name: string | null;
  total_votes: number;
  a_preferred: number;
  b_preferred: number;
  equal: number;
  a_win_rate: number;
  b_win_rate: number;
  statistical_significance: number | null;
}
