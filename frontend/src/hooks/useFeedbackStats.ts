'use client';

import { useState, useEffect, useCallback } from 'react';
import { ratingsApi, RatingStats } from '@/lib/api';

/**
 * Hook to fetch rating statistics for the dashboard
 * Uses the new RLHF ratings API
 */
export function useFeedbackStats() {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ratingsApi.getStats();
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feedback stats'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}
