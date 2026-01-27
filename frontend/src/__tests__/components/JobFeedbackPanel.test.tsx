import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { JobFeedbackPanel } from '@/components/JobFeedbackPanel';

// Mock the api module with modular APIs
const mockGetJobFeedback = vi.fn();
const mockDeleteRating = vi.fn();
const mockDeletePreference = vi.fn();
vi.mock('@/lib/api', () => ({
  generationApi: {
    getJobFeedback: (...args: unknown[]) => mockGetJobFeedback(...args),
  },
  ratingsApi: {
    delete: (...args: unknown[]) => mockDeleteRating(...args),
  },
  preferencesApi: {
    delete: (...args: unknown[]) => mockDeletePreference(...args),
  },
}));

const mockJobFeedbackData = {
  job_id: 'job-1',
  prompt_id: 'prompt-1',
  total_samples: 3,
  total_feedback: 5,
  average_rating: 3.8,
  samples: [
    {
      audio_id: 'audio-1',
      label: 'A',
      feedback: [
        {
          id: 'fb-1',
          rating: 4,
          rating_criterion: 'overall',
          preferred_over: null,
          tags: null,
          notes: 'Nice tune',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      average_rating: 4,
      feedback_count: 1,
      tags: ['good_melody'],  // Tags at sample level from AudioTag table
    },
    {
      audio_id: 'audio-2',
      label: 'B',
      feedback: [
        {
          id: 'fb-2',
          rating: 3,
          rating_criterion: 'overall',
          preferred_over: 'audio-1',
          tags: null,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      average_rating: 3,
      feedback_count: 1,
      tags: null,
    },
    {
      audio_id: 'audio-3',
      label: 'C',
      feedback: [],
      average_rating: null,
      feedback_count: 0,
      tags: null,
    },
  ],
};

describe('JobFeedbackPanel', () => {
  beforeEach(() => {
    mockGetJobFeedback.mockClear();
    mockGetJobFeedback.mockResolvedValue(mockJobFeedbackData);
  });

  it('renders job feedback panel', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/feedback/i)).toBeInTheDocument();
    });
  });

  it('fetches job feedback on mount', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      expect(mockGetJobFeedback).toHaveBeenCalledWith('job-1');
    });
  });

  it('displays sample cards', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/sample a/i)).toBeInTheDocument();
      expect(screen.getByText(/sample b/i)).toBeInTheDocument();
      expect(screen.getByText(/sample c/i)).toBeInTheDocument();
    });
  });

  it('displays feedback count for samples', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      // Check for feedback count text
      const feedbackCounts = screen.getAllByText(/\d+ feedback/);
      expect(feedbackCounts.length).toBeGreaterThan(0);
    });
  });

  it('displays "No feedback yet" for samples without feedback', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/no feedback yet/i)).toBeInTheDocument();
    });
  });

  it('displays tags for feedback', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('good_melody')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockGetJobFeedback.mockReturnValue(new Promise(() => {})); // Never resolves
    const { container } = render(<JobFeedbackPanel jobId="job-1" />);
    
    // Should show loading indicator (Loader2 has animate-spin)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('refreshes when refreshTrigger changes', async () => {
    const { rerender } = render(<JobFeedbackPanel jobId="job-1" refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(mockGetJobFeedback).toHaveBeenCalledTimes(1);
    });

    rerender(<JobFeedbackPanel jobId="job-1" refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockGetJobFeedback).toHaveBeenCalledTimes(2);
    });
  });

  it('renders sample label badges', async () => {
    render(<JobFeedbackPanel jobId="job-1" />);
    
    await waitFor(() => {
      // Sample badges A, B, C should be visible
      const badges = screen.getAllByText(/sample [abc]/i);
      expect(badges.length).toBe(3);
    });
  });
});
