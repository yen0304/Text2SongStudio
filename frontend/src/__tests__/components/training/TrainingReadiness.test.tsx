import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrainingReadiness } from '@/components/training/TrainingReadiness';
import { FeedbackStats } from '@/lib/api';

const mockStats: FeedbackStats = {
  total_feedback: 100,
  total_ratings: 80,
  total_preferences: 20,
  rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 25, 5: 20 },
  high_rated_samples: 25,
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

    expect(screen.getByText('25 / 50')).toBeInTheDocument();
  });

  it('shows how many more samples are needed when not ready', () => {
    render(
      <TrainingReadiness
        stats={mockStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    // 50 - 25 = 25 more needed
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText(/more high-rated samples/)).toBeInTheDocument();
  });

  it('shows ready state when enough samples collected', () => {
    const readyStats = { ...mockStats, high_rated_samples: 60 };

    render(
      <TrainingReadiness
        stats={readyStats}
        isLoading={false}
        onCreateDataset={vi.fn()}
      />
    );

    expect(screen.getByText('Ready to train!')).toBeInTheDocument();
    expect(screen.getByText('60 / 50')).toBeInTheDocument();
  });

  it('shows checkmark when ready', () => {
    const readyStats = { ...mockStats, high_rated_samples: 50 };

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
    const readyStats = { ...mockStats, high_rated_samples: 50 };

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
    const readyStats = { ...mockStats, high_rated_samples: 50 };
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
    const readyStats = { ...mockStats, high_rated_samples: 100 };

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
