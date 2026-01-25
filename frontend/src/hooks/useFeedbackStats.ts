'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, FeedbackStats } from '@/lib/api';

export function useFeedbackStats() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getFeedbackStats();
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
