import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { FeedbackStatsDisplay } from '@/components/training/FeedbackStatsDisplay';
import { FeedbackStats } from '@/lib/api';

const mockStats: FeedbackStats = {
  total_feedback: 150,
  total_ratings: 100,
  total_preferences: 50,
  high_rated_samples: 75,
  rating_distribution: {
    '1': 5,
    '2': 10,
    '3': 25,
    '4': 35,
    '5': 25,
  },
};

describe('FeedbackStatsDisplay', () => {
  it('renders feedback statistics', () => {
    render(
      <FeedbackStatsDisplay
        stats={mockStats}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <FeedbackStatsDisplay
        stats={null}
        isLoading={true}
      />
    );
    
    // Should show animated pulse elements
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no stats', () => {
    render(
      <FeedbackStatsDisplay
        stats={null}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('No feedback data available')).toBeInTheDocument();
  });

  it('displays all stat cards', () => {
    render(
      <FeedbackStatsDisplay
        stats={mockStats}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
    expect(screen.getByText('Ratings')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('High Rated (4+)')).toBeInTheDocument();
  });

  it('displays correct stat values', () => {
    render(
      <FeedbackStatsDisplay
        stats={mockStats}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders rating distribution chart', () => {
    render(
      <FeedbackStatsDisplay
        stats={mockStats}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
    
    // Should show star rating labels
    expect(screen.getByText('★1')).toBeInTheDocument();
    expect(screen.getByText('★2')).toBeInTheDocument();
    expect(screen.getByText('★3')).toBeInTheDocument();
    expect(screen.getByText('★4')).toBeInTheDocument();
    expect(screen.getByText('★5')).toBeInTheDocument();
  });

  it('displays rating counts in distribution', () => {
    render(
      <FeedbackStatsDisplay
        stats={mockStats}
        isLoading={false}
      />
    );
    
    // Rating distribution values are displayed (may appear multiple times)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0); // 1-star count
    expect(screen.getAllByText('10').length).toBeGreaterThan(0); // 2-star count
    expect(screen.getAllByText('25').length).toBeGreaterThan(0); // 3-star count
    expect(screen.getAllByText('35').length).toBeGreaterThan(0); // 4-star count
  });

  it('handles zero values in rating distribution', () => {
    const statsWithZeros: FeedbackStats = {
      ...mockStats,
      rating_distribution: {
        '1': 0,
        '2': 0,
        '3': 10,
        '4': 20,
        '5': 30,
      },
    };
    
    render(
      <FeedbackStatsDisplay
        stats={statsWithZeros}
        isLoading={false}
      />
    );
    
    // Should still render without errors
    expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
  });

  it('handles empty rating distribution', () => {
    const statsEmptyDistribution: FeedbackStats = {
      ...mockStats,
      rating_distribution: {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
    };
    
    render(
      <FeedbackStatsDisplay
        stats={statsEmptyDistribution}
        isLoading={false}
      />
    );
    
    // Should still render chart
    expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
  });
});
