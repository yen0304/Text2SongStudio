import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFeedbackStats } from '@/hooks/useFeedbackStats';

// Mock the api module with modular APIs
const mockGetStats = vi.fn();
vi.mock('@/lib/api', () => ({
  feedbackApi: {
    getStats: (...args: unknown[]) => mockGetStats(...args),
  },
}));

const mockStats = {
  total_feedback: 100,
  total_ratings: 80,
  total_preferences: 20,
  rating_distribution: { 1: 10, 2: 15, 3: 25, 4: 30, 5: 20 },
  high_rated_samples: 50,
};

describe('useFeedbackStats', () => {
  beforeEach(() => {
    mockGetStats.mockClear();
  });

  it('returns loading state initially', () => {
    mockGetStats.mockReturnValue(new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useFeedbackStats());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches feedback stats on mount', async () => {
    mockGetStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useFeedbackStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('handles error state', async () => {
    mockGetStats.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFeedbackStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.stats).toBeNull();
  });

  it('handles non-Error rejections', async () => {
    mockGetStats.mockRejectedValue('string error');

    const { result } = renderHook(() => useFeedbackStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Failed to fetch feedback stats');
  });

  it('provides refresh function that refetches data', async () => {
    const initialStats = { ...mockStats, total_feedback: 100 };
    const updatedStats = { ...mockStats, total_feedback: 150 };
    
    mockGetStats
      .mockResolvedValueOnce(initialStats)
      .mockResolvedValueOnce(updatedStats);

    const { result } = renderHook(() => useFeedbackStats());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats?.total_feedback).toBe(100);

    // Call refresh
    await result.current.refresh();

    await waitFor(() => expect(result.current.stats?.total_feedback).toBe(150));
  });
});
