import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { FeedbackHistory } from '@/components/FeedbackHistory';

// Mock the api module
const mockListFeedback = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    listFeedback: (...args: unknown[]) => mockListFeedback(...args),
  },
}));

const mockFeedbackData = {
  items: [
    {
      id: 'feedback-1',
      audio_id: 'audio-1',
      rating: 4,
      rating_criterion: 'overall',
      preferred_over: null,
      tags: ['good_melody', 'creative'],
      notes: 'Nice melody!',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'feedback-2',
      audio_id: 'audio-2',
      rating: 3,
      rating_criterion: 'overall',
      preferred_over: 'audio-1',
      tags: ['repetitive'],
      notes: null,
      created_at: '2024-01-02T00:00:00Z',
    },
  ],
  total: 2,
};

describe('FeedbackHistory', () => {
  beforeEach(() => {
    mockListFeedback.mockClear();
    mockListFeedback.mockResolvedValue(mockFeedbackData);
  });

  it('renders feedback history component', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Feedback History')).toBeInTheDocument();
    });
  });

  it('fetches and displays feedback', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenCalled();
    });
  });

  it('displays job ID filter input', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/job id/i)).toBeInTheDocument();
    });
  });

  it('displays rating filter', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      // Should have a rating filter dropdown or input
      const ratingFilter = screen.getByRole('combobox');
      expect(ratingFilter).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockListFeedback.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<FeedbackHistory />);
    
    // Should show loading indicator
    expect(screen.getByText('Feedback History')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockListFeedback.mockRejectedValue(new Error('API Error'));
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      // Should display error message
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('uses initialJobId prop as filter', async () => {
    render(<FeedbackHistory initialJobId="job-123" />);
    
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: 'job-123',
        })
      );
    });
  });

  it('supports pagination', async () => {
    mockListFeedback.mockResolvedValue({ items: [], total: 100 });
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      // Should show pagination controls
      const paginationButtons = screen.getAllByRole('button');
      expect(paginationButtons.length).toBeGreaterThan(0);
    });
  });

  it('searches feedback when search button is clicked', async () => {
    const { user } = render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/job id/i);
    await user.type(searchInput, 'job-456');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: 'job-456',
        })
      );
    });
  });
});
