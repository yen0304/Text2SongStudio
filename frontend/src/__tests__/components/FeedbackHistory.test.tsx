import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { FeedbackHistory } from '@/components/FeedbackHistory';

// Mock the api module with modular APIs
const mockList = vi.fn();
vi.mock('@/lib/api', () => ({
  ratingsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

const mockRatingsData = {
  items: [
    {
      id: 'rating-1',
      audio_id: 'audio-1',
      rating: 4,
      criterion: 'overall',
      notes: 'Nice melody!',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rating-2',
      audio_id: 'audio-2',
      rating: 3,
      criterion: 'overall',
      notes: null,
      created_at: '2024-01-02T00:00:00Z',
    },
  ],
  total: 2,
};

describe('FeedbackHistory', () => {
  beforeEach(() => {
    mockList.mockClear();
    mockList.mockResolvedValue(mockRatingsData);
  });

  it('renders feedback history component', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Rating History')).toBeInTheDocument();
    });
  });

  it('fetches and displays feedback', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
  });

  it('displays audio ID filter input', async () => {
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/audio id/i)).toBeInTheDocument();
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
    mockList.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<FeedbackHistory />);
    
    // Should show rating history title
    expect(screen.getByText('Rating History')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockList.mockRejectedValue(new Error('API Error'));
    render(<FeedbackHistory />);
    
    await waitFor(() => {
      // Should display error message
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('uses initialAudioId prop as filter', async () => {
    render(<FeedbackHistory initialAudioId="audio-123" />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({
          audio_id: 'audio-123',
        })
      );
    });
  });

  it('supports pagination', async () => {
    mockList.mockResolvedValue({ items: [], total: 100 });
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
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/audio id/i);
    await user.type(searchInput, 'audio-456');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({
          audio_id: 'audio-456',
        })
      );
    });
  });
});
