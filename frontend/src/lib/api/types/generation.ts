/**
 * Generation job-related types
 */

export interface GenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  audio_ids?: string[];
  error?: string;
}

export interface JobDetail {
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
}

export interface JobStats {
  status_counts: Record<string, number>;
  active_jobs: number;
  avg_processing_time_seconds: number | null;
  jobs_today: number;
  total_jobs: number;
}

export interface SubmitGenerationRequest {
  prompt_id: string;
  num_samples?: number;
  adapter_id?: string;
  duration?: number;  // Audio duration in seconds (1-120)
}

// Job Feedback Types
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
  tags: string[] | null;
}

export interface JobFeedbackResponse {
  job_id: string;
  prompt_id: string;
  total_samples: number;
  total_feedback: number;
  average_rating: number | null;
  samples: SampleFeedbackGroup[];
}
