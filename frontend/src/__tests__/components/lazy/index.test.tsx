import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';

// Mock the dynamic imports
vi.mock('@/components/charts/MetricsChart', () => ({
  MetricsChart: () => <div data-testid="metrics-chart">MetricsChart</div>,
}));

vi.mock('@/components/AudioPlayer', () => ({
  AudioPlayer: () => <div data-testid="audio-player">AudioPlayer</div>,
}));

vi.mock('@/components/comparison/RunComparison', () => ({
  RunComparison: () => <div data-testid="run-comparison">RunComparison</div>,
}));

vi.mock('@/components/comparison/ComparisonPlayer', () => ({
  ComparisonPlayer: () => <div data-testid="comparison-player">ComparisonPlayer</div>,
}));

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>, options: { loading?: () => React.ReactNode }) => {
    // Return a component that shows loading first then the actual component
    return function DynamicComponent(props: unknown) {
      const LoadingComponent = options?.loading;
      return LoadingComponent ? LoadingComponent() : null;
    };
  },
}));

describe('Lazy Components', () => {
  it('shows loading skeleton for LazyMetricsChart', async () => {
    // Import the lazy component
    const { LazyMetricsChart } = await import('@/components/lazy');
    
    const { container } = render(<LazyMetricsChart data={[]} />);
    
    // Should show loading skeleton
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows loading skeleton for LazyAudioPlayer', async () => {
    const { LazyAudioPlayer } = await import('@/components/lazy');
    
    const { container } = render(<LazyAudioPlayer audioIds={[]} />);
    
    // Should show loading skeleton
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows loading skeleton for LazyRunComparison', async () => {
    const { LazyRunComparison } = await import('@/components/lazy');
    
    const { container } = render(
      <LazyRunComparison runs={[]} bestRunId={null} onClose={vi.fn()} />
    );
    
    // Should show loading skeleton
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows loading skeleton for LazyComparisonPlayer', async () => {
    const { LazyComparisonPlayer } = await import('@/components/lazy');
    
    const mockPair = {
      id: 'pair-1',
      prompt_id: 'prompt-1',
      audio_a_id: 'audio-a',
      audio_b_id: 'audio-b',
      preference: null,
      voted_at: null,
      is_ready: true,
    };
    
    const { container } = render(
      <LazyComparisonPlayer pair={mockPair} testId="test-1" onVoted={vi.fn()} />
    );
    
    // Should show loading skeleton (two audio player skeletons)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('Lazy Component Exports', () => {
  it('exports LazyMetricsChart', async () => {
    const lazyModule = await import('@/components/lazy');
    expect(lazyModule.LazyMetricsChart).toBeDefined();
  });

  it('exports LazyAudioPlayer', async () => {
    const lazyModule = await import('@/components/lazy');
    expect(lazyModule.LazyAudioPlayer).toBeDefined();
  });

  it('exports LazyRunComparison', async () => {
    const lazyModule = await import('@/components/lazy');
    expect(lazyModule.LazyRunComparison).toBeDefined();
  });

  it('exports LazyComparisonPlayer', async () => {
    const lazyModule = await import('@/components/lazy');
    expect(lazyModule.LazyComparisonPlayer).toBeDefined();
  });
});
