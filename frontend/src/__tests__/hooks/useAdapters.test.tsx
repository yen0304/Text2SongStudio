import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdapters } from '@/hooks/useAdapters';
import { createMockAdapter } from '@/__mocks__/api';

// Mock the api module with modular APIs
const mockList = vi.fn();
vi.mock('@/lib/api', () => ({
  adaptersApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

describe('useAdapters', () => {
  beforeEach(() => {
    mockList.mockClear();
  });

  it('returns loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useAdapters());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.adapters).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches adapters on mount', async () => {
    const mockAdapters = [createMockAdapter({ id: 'adapter-1' }), createMockAdapter({ id: 'adapter-2' })];
    mockList.mockResolvedValue({ items: mockAdapters, total: 2 });

    const { result } = renderHook(() => useAdapters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.adapters).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('handles error state', async () => {
    mockList.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAdapters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.adapters).toEqual([]);
  });

  it('handles non-Error rejections', async () => {
    mockList.mockRejectedValue('string error');

    const { result } = renderHook(() => useAdapters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Failed to fetch adapters');
  });

  it('passes activeOnly parameter to API', async () => {
    mockList.mockResolvedValue({ items: [], total: 0 });

    renderHook(() => useAdapters(true));

    await waitFor(() => expect(mockList).toHaveBeenCalled());

    expect(mockList).toHaveBeenCalledWith({ activeOnly: true });
  });

  it('provides refresh function that refetches data', async () => {
    const initialAdapters = [createMockAdapter({ id: 'adapter-1' })];
    const updatedAdapters = [createMockAdapter({ id: 'adapter-1' }), createMockAdapter({ id: 'adapter-2' })];
    
    mockList
      .mockResolvedValueOnce({ items: initialAdapters, total: 1 })
      .mockResolvedValueOnce({ items: updatedAdapters, total: 2 });

    const { result } = renderHook(() => useAdapters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.adapters).toHaveLength(1);

    // Call refresh
    await result.current.refresh();

    await waitFor(() => expect(result.current.adapters).toHaveLength(2));
  });

  it('refetches when activeOnly changes', async () => {
    mockList.mockResolvedValue({ items: [], total: 0 });

    const { rerender } = renderHook(
      ({ activeOnly }) => useAdapters(activeOnly),
      { initialProps: { activeOnly: false } }
    );

    await waitFor(() => expect(mockList).toHaveBeenCalledWith({ activeOnly: false }));

    rerender({ activeOnly: true });

    await waitFor(() => expect(mockList).toHaveBeenCalledWith({ activeOnly: true }));
  });
});
