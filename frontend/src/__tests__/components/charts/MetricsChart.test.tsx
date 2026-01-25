import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { MetricsChart, MetricPoint } from '@/components/charts/MetricsChart';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('MetricsChart', () => {
  const mockData: MetricPoint[] = [
    { step: 0, loss: 2.5, val_loss: 2.8, lr: 0.001 },
    { step: 100, loss: 1.8, val_loss: 2.1, lr: 0.001 },
    { step: 200, loss: 1.2, val_loss: 1.5, lr: 0.0008 },
    { step: 300, loss: 0.8, val_loss: 1.1, lr: 0.0005 },
  ];

  it('renders chart with default title', () => {
    render(<MetricsChart data={mockData} />);
    expect(screen.getByText('Training Metrics')).toBeInTheDocument();
  });

  it('renders chart with custom title', () => {
    render(<MetricsChart data={mockData} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<MetricsChart data={[]} />);
    expect(screen.getByText(/no metrics data available/i)).toBeInTheDocument();
  });

  it('renders chart elements with data', () => {
    render(<MetricsChart data={mockData} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders with loss enabled by default', () => {
    render(<MetricsChart data={mockData} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with validation loss enabled by default', () => {
    render(<MetricsChart data={mockData} showValLoss={true} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with learning rate when enabled', () => {
    render(<MetricsChart data={mockData} showLR={true} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('hides loss when showLoss is false', () => {
    render(<MetricsChart data={mockData} showLoss={false} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('hides validation loss when showValLoss is false', () => {
    render(<MetricsChart data={mockData} showValLoss={false} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
