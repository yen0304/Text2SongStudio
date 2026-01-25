import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasets } from '@/hooks/useDatasets';
import { createMockDataset } from '@/__mocks__/api';

// Mock the api module with modular APIs
const mockList = vi.fn();
vi.mock('@/lib/api', () => ({
  datasetsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

describe('useDatasets', () => {
  beforeEach(() => {
    mockList.mockClear();
  });

  it('returns loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useDatasets());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.datasets).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches datasets on mount', async () => {
    const mockDatasets = [
      createMockDataset({ id: 'dataset-1', name: 'Training Data' }),
      createMockDataset({ id: 'dataset-2', name: 'Validation Data' }),
    ];
    mockList.mockResolvedValue({ items: mockDatasets, total: 2 });

    const { result } = renderHook(() => useDatasets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.datasets).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('handles error state', async () => {
    mockList.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDatasets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.datasets).toEqual([]);
  });

  it('handles non-Error rejections', async () => {
    mockList.mockRejectedValue('string error');

    const { result } = renderHook(() => useDatasets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Failed to fetch datasets');
  });

  it('provides refresh function that refetches data', async () => {
    const initialDatasets = [createMockDataset({ id: 'dataset-1' })];
    const updatedDatasets = [
      createMockDataset({ id: 'dataset-1' }),
      createMockDataset({ id: 'dataset-2' }),
    ];
    
    mockList
      .mockResolvedValueOnce({ items: initialDatasets, total: 1 })
      .mockResolvedValueOnce({ items: updatedDatasets, total: 2 });

    const { result } = renderHook(() => useDatasets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.datasets).toHaveLength(1);

    // Call refresh
    await result.current.refresh();

    await waitFor(() => expect(result.current.datasets).toHaveLength(2));
  });
});
