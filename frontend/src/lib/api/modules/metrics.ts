/**
 * Metrics API Module
 * 
 * Handles all metrics-related API operations
 */

import { fetchApi } from '../client';
import type { OverviewMetrics, FeedbackMetrics } from '../types/metrics';

export const metricsApi = {
  /**
   * Get overview metrics for dashboard
   */
  getOverview: () => 
    fetchApi<OverviewMetrics>('/metrics/overview'),

  /**
   * Get feedback-specific metrics
   */
  getFeedback: () => 
    fetchApi<FeedbackMetrics>('/metrics/feedback'),
};
