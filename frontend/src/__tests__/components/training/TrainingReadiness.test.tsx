import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrainingReadiness } from '@/components/training/TrainingReadiness';
import { RatingStats } from '@/lib/api';

const mockStats: RatingStats = {
  audio_id: null,
  total_ratings: 80,
  average_rating: 3.6,
  rating_by_criterion: {
    overall: 3.6,
    melody: 3.8,
    rhythm: 3.5,
    harmony: 3.6,
    coherence: 3.7,
    creativity: 3.9,
    adherence: 3.4,
  },
  rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 25, 5: 20 },
};

describe('TrainingReadiness', () => {
  it('shows loading state when isLoading is true', () => {
    const { container } = render(
      <TrainingReadiness
        stats={null}
        isLoading={true}
        onCreateDataset={vi.fn()}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays high-rated sample count and requirement', () => {
    render(
      <TrainingReadiness
        stats={mockStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );
    
    // High rated = 25 + 20 = 45
    expect(screen.getByText('45 / 50')).toBeInTheDocument();
  });

  it('shows how many more samples are needed when not ready', () => {
    render(
      <TrainingReadiness
        stats={mockStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    // 50 - 45 = 5 more needed
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/more high-rated samples/)).toBeInTheDocument();
  });

  it('shows ready state when enough samples collected', () => {
    const readyStats: RatingStats = { 
      ...mockStats, 
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 30, 5: 35 }  // 30+35=65 high rated
    };

    render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('Ready to train!')).toBeInTheDocument();
    expect(screen.getByText('65 / 50')).toBeInTheDocument();
  });

  it('shows checkmark when ready', () => {
    const readyStats: RatingStats = { 
      ...mockStats, 
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 25, 5: 25 }  // 25+25=50 high rated
    };

    render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows Create Dataset button when ready', () => {
    const readyStats: RatingStats = { 
      ...mockStats, 
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 25, 5: 25 }  // 50 high rated
    };

    render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('Create Dataset')).toBeInTheDocument();
  });

  it('calls onCreateDataset when button is clicked', () => {
    const readyStats: RatingStats = { 
      ...mockStats, 
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 25, 5: 25 }  // 50 high rated
    };
    const onCreateDataset = vi.fn();

    render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={onCreateDataset}
      />
    );

    fireEvent.click(screen.getByText('Create Dataset'));

    expect(onCreateDataset).toHaveBeenCalledTimes(1);
  });

  it('displays training tips', () => {
    render(
      <TrainingReadiness
        stats={mockStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('Tips for better training:')).toBeInTheDocument();
    expect(screen.getByText(/Generate multiple samples/)).toBeInTheDocument();
    expect(screen.getByText(/Rate samples honestly/)).toBeInTheDocument();
    expect(screen.getByText(/Use A\/B comparisons/)).toBeInTheDocument();
  });

  it('shows 0 high-rated samples when stats are null', () => {
    render(
      <TrainingReadiness
        stats={null}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('0 / 50')).toBeInTheDocument();
  });

  it('caps progress bar at 100%', () => {
    const readyStats: RatingStats = { 
      ...mockStats, 
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 50, 5: 55 }  // 105 high rated
    };

    const { container } = render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    // Progress bar should be at 100%, not 200%
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
