'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Dataset } from '@/lib/api';

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listDatasets();
      setDatasets(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch datasets'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    datasets,
    total,
    isLoading,
    error,
    refresh,
  };
}
