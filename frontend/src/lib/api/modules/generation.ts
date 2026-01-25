/**
 * Generation API Module
 * 
 * Handles all generation job-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  GenerationJob, 
  JobDetail, 
  JobStats, 
  SubmitGenerationRequest 
} from '../types/generation';
import type { JobFeedbackResponse } from '../types/feedback';
import type { PaginatedResponse } from '../types/common';

export interface ListJobsParams {
  status?: string;
  adapter_id?: string;
  limit?: number;
  offset?: number;
}

export const generationApi = {
  /**
   * Submit a new generation job
   */
  submit: (data: SubmitGenerationRequest) =>
    fetchApi<GenerationJob>('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get generation job status
   */
  getStatus: (jobId: string) => 
    fetchApi<GenerationJob>(`/generate/${jobId}`),

  /**
   * Get feedback for a generation job
   */
  getJobFeedback: (jobId: string) => 
    fetchApi<JobFeedbackResponse>(`/generate/${jobId}/feedback`),

  /**
   * Cancel a generation job
   */
  cancel: (jobId: string) =>
    fetchApi<void>(`/generate/${jobId}`, { method: 'DELETE' }),

  /**
   * List all jobs with filters
   */
  listJobs: (params?: ListJobsParams) => {
    const query = buildQueryString({
      status: params?.status,
      adapter_id: params?.adapter_id,
      limit: params?.limit,
      offset: params?.offset,
    });
    return fetchApi<PaginatedResponse<JobDetail> & { limit: number; offset: number }>(`/jobs${query}`);
  },

  /**
   * Get job statistics
   */
  getJobStats: () => 
    fetchApi<JobStats>('/jobs/stats'),

  /**
   * Get a specific job detail
   */
  getJob: (jobId: string) => 
    fetchApi<JobDetail>(`/jobs/${jobId}`),

  /**
   * Delete a job
   */
  deleteJob: (jobId: string) =>
    fetchApi<{ status: string; job_id: string }>(`/jobs/${jobId}`, { method: 'DELETE' }),
};
