/**
 * A/B Tests API Module
 * 
 * Handles all A/B test-related API operations
 */

import { fetchApi, buildQueryString } from '../client';
import type { 
  ABTest, 
  ABTestDetail, 
  ABTestPair,
  ABTestResults,
  CreateABTestRequest,
  GenerateSamplesRequest
} from '../types/ab-tests';
import type { PaginatedResponse } from '../types/common';

export interface ListABTestsParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export const abTestsApi = {
  /**
   * List all A/B tests with filters
   */
  list: (params?: ListABTestsParams) => {
    const query = buildQueryString({
      status: params?.status,
      limit: params?.limit,
      offset: params?.offset,
    });
    return fetchApi<PaginatedResponse<ABTest> & { limit: number; offset: number }>(`/ab-tests${query}`);
  },

  /**
   * Get a specific A/B test with pairs
   */
  get: (id: string) => 
    fetchApi<ABTestDetail>(`/ab-tests/${id}`),

  /**
   * Create a new A/B test
   */
  create: (data: CreateABTestRequest) =>
    fetchApi<ABTest>('/ab-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Generate samples for an A/B test
   */
  generateSamples: (testId: string, data?: GenerateSamplesRequest) =>
    fetchApi<ABTest>(`/ab-tests/${testId}/generate`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  /**
   * Submit a vote for an A/B test pair
   */
  submitVote: (testId: string, pairId: string, preference: 'a' | 'b' | 'equal') =>
    fetchApi<ABTestPair>(`/ab-tests/${testId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ pair_id: pairId, preference }),
    }),

  /**
   * Get results for an A/B test
   */
  getResults: (testId: string) =>
    fetchApi<ABTestResults>(`/ab-tests/${testId}/results`),
};
