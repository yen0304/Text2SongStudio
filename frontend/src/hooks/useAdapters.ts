'use client';

import { useState, useEffect, useCallback } from 'react';
import { adaptersApi, Adapter } from '@/lib/api';

export function useAdapters(activeOnly = false) {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adaptersApi.list({ activeOnly });
      setAdapters(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch adapters'));
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    adapters,
    total,
    isLoading,
    error,
    refresh,
  };
}
