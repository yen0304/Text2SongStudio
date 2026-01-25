import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { StatusBar } from '@/components/layout/StatusBar';

// Mock the api module
const mockGetOverview = vi.fn();
vi.mock('@/lib/api', () => ({
  metricsApi: {
    getOverview: () => mockGetOverview(),
  },
}));

describe('StatusBar', () => {
  beforeEach(() => {
    mockGetOverview.mockResolvedValue({
      pipeline: {
        generation: { total: 100, completed: 80, active: 5 },
        feedback: { total: 200, rated_samples: 150, pending: 25 },
        dataset: { total: 10, exported: 5 },
        training: { total: 5, running: 1 },
      },
      quick_stats: {},
    });
  });

  afterEach(() => {
    mockGetOverview.mockClear();
  });

  it('renders status bar', async () => {
    render(<StatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText(/Active Jobs:/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Pending Feedback:/)).toBeInTheDocument();
  });

  it('displays active jobs count', async () => {
    render(<StatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Jobs: 5')).toBeInTheDocument();
    });
  });

  it('displays pending feedback count', async () => {
    render(<StatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('Pending Feedback: 25')).toBeInTheDocument();
    });
  });

  it('links to jobs page with processing filter', async () => {
    render(<StatusBar />);
    
    await waitFor(() => {
      const activeJobsLink = screen.getByRole('link', { name: /active jobs/i });
      expect(activeJobsLink).toHaveAttribute('href', '/jobs?status=processing');
    });
  });

  it('links to jobs page for pending feedback', async () => {
    render(<StatusBar />);
    
    await waitFor(() => {
      const pendingFeedbackLink = screen.getByRole('link', { name: /pending feedback/i });
      expect(pendingFeedbackLink).toHaveAttribute('href', '/jobs');
    });
  });

  it('displays version number', () => {
    render(<StatusBar />);
    expect(screen.getByText(/v0\.1\.0/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockGetOverview.mockRejectedValue(new Error('API Error'));
    
    // Should not crash
    render(<StatusBar />);
    
    // Should still render with default values
    await waitFor(() => {
      expect(screen.getByText(/Active Jobs:/)).toBeInTheDocument();
    });
  });
});
