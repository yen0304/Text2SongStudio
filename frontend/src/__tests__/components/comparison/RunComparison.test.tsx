import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { RunComparison } from '@/components/comparison/RunComparison';
import { ExperimentRun } from '@/lib/api';

// Mock lucide-react icons (including all icons used by TrainingMetricsChart)
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon" />,
  TrendingUp: () => <span data-testid="trending-up-icon" />,
  TrendingDown: () => <span data-testid="trending-down-icon" />,
  Minus: () => <span data-testid="minus-icon" />,
  Trophy: () => <span data-testid="trophy-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Activity: () => <span data-testid="activity-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronUp: () => <span data-testid="chevron-up-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  BarChart3: () => <span data-testid="bar-chart-icon" />,
}));

// Mock recharts - avoid rendering actual SVG (needed by TrainingMetricsChart)
vi.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    LineChart: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'line-chart' }, children),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
    ReferenceLine: () => React.createElement('div', { 'data-testid': 'reference-line' }),
  };
});

// Mock experimentsApi for TrainingMetricsChart
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    experimentsApi: {
      ...actual.experimentsApi,
      getRunMetrics: vi.fn().mockResolvedValue({
        run_id: 'run-1',
        metrics: {},
        metadata: { last_updated: null, is_complete: true, status: 'completed' },
      }),
    },
  };
});

const mockRuns: ExperimentRun[] = [
  {
    id: 'run-1',
    experiment_id: 'exp-1',
    adapter_id: 'adapter-1',
    name: 'Run Alpha',
    status: 'completed',
    config: { learning_rate: 0.001 },
    metrics: { accuracy: 0.95 },
    final_loss: 0.1234,
    error: null,
    started_at: '2024-01-01T00:00:00Z',
    completed_at: '2024-01-01T01:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'run-2',
    experiment_id: 'exp-1',
    adapter_id: 'adapter-2',
    name: 'Run Beta',
    status: 'completed',
    config: { learning_rate: 0.01 },
    metrics: { accuracy: 0.88 },
    final_loss: 0.2345,
    error: null,
    started_at: '2024-01-02T00:00:00Z',
    completed_at: '2024-01-02T02:00:00Z',
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('RunComparison', () => {
  it('renders comparison table with runs', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Run Comparison/)).toBeInTheDocument();
    expect(screen.getAllByText('Run Alpha').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Run Beta').length).toBeGreaterThan(0);
  });

  it('returns null when no runs provided', () => {
    const { container } = render(
      <RunComparison
        runs={[]}
        experimentId="exp-1"
        bestRunId={null}
        onClose={vi.fn()}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('shows best run indicator', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    // Should show "Best" badge
    const bestBadges = screen.getAllByText('Best');
    expect(bestBadges.length).toBeGreaterThan(0);
  });

  it('displays final loss values', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getAllByText('0.1234').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.2345').length).toBeGreaterThan(0);
  });

  it('shows run status badges', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    const completedBadges = screen.getAllByText('completed');
    expect(completedBadges.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={onClose}
      />
    );
    
    // Find and click close button
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('displays duration information', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    // Duration row should exist (mobile and desktop views)
    expect(screen.getAllByText('Duration').length).toBeGreaterThan(0);
  });

  it('shows summary when multiple runs with valid losses', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText(/achieved the lowest loss/)).toBeInTheDocument();
  });

  it('handles runs with different statuses', () => {
    const mixedStatusRuns: ExperimentRun[] = [
      { ...mockRuns[0], status: 'running' },
      { ...mockRuns[1], status: 'failed' },
    ];
    
    render(
      <RunComparison
        runs={mixedStatusRuns}
        experimentId="exp-1"
        bestRunId={null}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getAllByText('running').length).toBeGreaterThan(0);
    expect(screen.getAllByText('failed').length).toBeGreaterThan(0);
  });

  it('handles runs with null loss values', () => {
    const runsWithNullLoss: ExperimentRun[] = [
      { ...mockRuns[0], final_loss: null },
      { ...mockRuns[1] },
    ];
    
    render(
      <RunComparison
        runs={runsWithNullLoss}
        experimentId="exp-1"
        bestRunId="run-2"
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('displays metrics rows', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    // The accuracy metric should be displayed
    expect(screen.getByText('accuracy')).toBeInTheDocument();
  });

  it('shows adapter link when adapter_id present', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    const viewAdapterLinks = screen.getAllByText('View Adapter');
    expect(viewAdapterLinks.length).toBeGreaterThan(0);
  });

  it('handles single run without summary', () => {
    const singleRun = [mockRuns[0]];
    
    render(
      <RunComparison
        runs={singleRun}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    // Summary should not show for single run
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('displays run count in header', () => {
    render(
      <RunComparison
        runs={mockRuns}
        experimentId="exp-1"
        bestRunId="run-1"
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText(/2 runs/)).toBeInTheDocument();
  });
});
