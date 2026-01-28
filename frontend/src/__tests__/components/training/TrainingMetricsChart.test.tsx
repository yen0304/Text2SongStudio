import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';

// Mock recharts - avoid rendering actual SVG
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

// Mock experimentsApi
const mockGetRunMetrics = vi.fn();

vi.mock('@/lib/api', () => ({
  experimentsApi: {
    getRunMetrics: (...args: unknown[]) => mockGetRunMetrics(...args),
  },
}));

// Import component after mocks are set up
import { TrainingMetricsChart } from '@/components/training/TrainingMetricsChart';

describe('TrainingMetricsChart', () => {
  const mockExperimentId = 'exp-123';
  const mockRunId = 'run-456';

  const mockMetricsResponse = {
    run_id: mockRunId,
    metrics: {
      loss: [
        { step: 1, value: 2.5, timestamp: '2026-01-28T12:00:00Z' },
        { step: 10, value: 2.0, timestamp: '2026-01-28T12:01:00Z' },
        { step: 20, value: 1.5, timestamp: '2026-01-28T12:02:00Z' },
      ],
      learning_rate: [
        { step: 1, value: 0.001, timestamp: '2026-01-28T12:00:00Z' },
        { step: 10, value: 0.001, timestamp: '2026-01-28T12:01:00Z' },
      ],
    },
    metadata: {
      last_updated: '2026-01-28T12:02:00Z',
      is_complete: false,
      status: 'running',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRunMetrics.mockResolvedValue(mockMetricsResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    // Don't resolve the promise immediately
    mockGetRunMetrics.mockReturnValue(new Promise(() => {}));
    
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
      />
    );

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('renders chart with data after loading', async () => {
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading metrics...')).not.toBeInTheDocument();
    });

    // Check that the API was called with correct parameters
    expect(mockGetRunMetrics).toHaveBeenCalledWith(mockExperimentId, mockRunId);

    // Check chart elements are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows empty state when no metrics available', async () => {
    mockGetRunMetrics.mockResolvedValue({
      run_id: mockRunId,
      metrics: {},
      metadata: {
        last_updated: null,
        is_complete: false,
        status: 'pending',
      },
    });

    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No metrics available yet')).toBeInTheDocument();
    });
  });

  it('shows live indicator when isLive is true', async () => {
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
        isLive={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('displays the latest value', async () => {
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
      />
    );

    await waitFor(() => {
      // Latest loss value should be 1.5 (last in the array)
      expect(screen.getByText('1.5000')).toBeInTheDocument();
    });
  });

  it('shows metric selector when showMetricSelector is true', async () => {
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
        showMetricSelector={true}
      />
    );

    await waitFor(() => {
      // Should have a select element with metric options
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    mockGetRunMetrics.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
      />
    );

    // When all run fetches fail, the component shows empty state
    // (individual errors are caught and logged, allowing partial data)
    await waitFor(() => {
      expect(screen.getByText('No metrics available yet')).toBeInTheDocument();
    });
  });

  it('polls for updates when isLive is true', async () => {
    // Verify polling is configured by checking multiple API calls
    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
        isLive={true}
        pollInterval={100} // Short interval for test
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetRunMetrics).toHaveBeenCalledTimes(1);
    });

    // Wait for at least one more poll (using real time with short interval)
    await waitFor(() => {
      expect(mockGetRunMetrics.mock.calls.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 500 });
  });

  it('supports multiple run IDs for comparison', async () => {
    const mockRunId2 = 'run-789';
    const mockMetricsResponse2 = {
      run_id: mockRunId2,
      metrics: {
        loss: [
          { step: 1, value: 3.0, timestamp: '2026-01-28T12:00:00Z' },
          { step: 10, value: 2.5, timestamp: '2026-01-28T12:01:00Z' },
        ],
      },
      metadata: {
        last_updated: '2026-01-28T12:01:00Z',
        is_complete: true,
        status: 'completed',
      },
    };

    mockGetRunMetrics.mockImplementation((expId: string, runId: string) => {
      if (runId === mockRunId) return Promise.resolve(mockMetricsResponse);
      if (runId === mockRunId2) return Promise.resolve(mockMetricsResponse2);
      return Promise.reject(new Error('Unknown run'));
    });

    render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={[mockRunId, mockRunId2]}
        runNames={{
          [mockRunId]: 'Run 1',
          [mockRunId2]: 'Run 2',
        }}
      />
    );

    await waitFor(() => {
      // Both runs should be fetched
      expect(mockGetRunMetrics).toHaveBeenCalledWith(mockExperimentId, mockRunId);
      expect(mockGetRunMetrics).toHaveBeenCalledWith(mockExperimentId, mockRunId2);
    });

    // Legend should be present for multiple runs
    await waitFor(() => {
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  it('respects custom height prop', async () => {
    const { container } = render(
      <TrainingMetricsChart
        experimentId={mockExperimentId}
        runIds={mockRunId}
        height="500px"
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading metrics...')).not.toBeInTheDocument();
    });

    // Check that height style is applied (either to chart or empty state container)
    const chartContainer = container.querySelector('[style*="height: 500px"]');
    expect(chartContainer).toBeInTheDocument();
  });
});
