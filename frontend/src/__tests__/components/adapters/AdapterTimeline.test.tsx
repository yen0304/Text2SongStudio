import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { AdapterTimelineView } from '@/components/adapters/AdapterTimeline';
import { AdapterTimeline } from '@/lib/api';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  GitBranch: () => <span data-testid="git-branch-icon" />,
  Zap: () => <span data-testid="zap-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  XCircle: () => <span data-testid="x-circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Package: () => <span data-testid="package-icon" />,
}));

const mockTimeline: AdapterTimeline = {
  adapter_id: 'adapter-1',
  adapter_name: 'Test Adapter',
  total_versions: 3,
  total_training_runs: 5,
  events: [
    {
      id: 'event-1',
      type: 'created',
      timestamp: '2024-01-01T00:00:00Z',
      title: 'Adapter Created',
      description: 'Initial creation',
      metadata: null,
    },
    {
      id: 'event-2',
      type: 'version',
      timestamp: '2024-01-02T00:00:00Z',
      title: 'Version 1.0.0',
      description: 'First version',
      metadata: {
        version: '1.0.0',
        is_active: true,
      },
    },
    {
      id: 'event-3',
      type: 'training',
      timestamp: '2024-01-03T00:00:00Z',
      title: 'Training Run #1',
      description: 'Training completed',
      metadata: {
        status: 'completed',
        final_loss: 0.1234,
      },
    },
  ],
};

describe('AdapterTimelineView', () => {
  it('renders timeline with events', () => {
    render(<AdapterTimelineView timeline={mockTimeline} />);
    
    expect(screen.getByText('Evolution Timeline')).toBeInTheDocument();
    expect(screen.getByText('Adapter Created')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Training Run #1')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    const emptyTimeline: AdapterTimeline = {
      ...mockTimeline,
      events: [],
    };
    
    render(<AdapterTimelineView timeline={emptyTimeline} />);
    
    expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
  });

  it('displays version badges', () => {
    render(<AdapterTimelineView timeline={mockTimeline} />);
    
    expect(screen.getByText('3 versions')).toBeInTheDocument();
    expect(screen.getByText('5 training runs')).toBeInTheDocument();
  });

  it('shows version metadata', () => {
    render(<AdapterTimelineView timeline={mockTimeline} />);
    
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows training status', () => {
    render(<AdapterTimelineView timeline={mockTimeline} />);
    
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('Loss: 0.1234')).toBeInTheDocument();
  });

  it('renders event descriptions', () => {
    render(<AdapterTimelineView timeline={mockTimeline} />);
    
    expect(screen.getByText('Initial creation')).toBeInTheDocument();
    expect(screen.getByText('First version')).toBeInTheDocument();
  });

  it('handles training event with pending status', () => {
    const pendingTimeline: AdapterTimeline = {
      ...mockTimeline,
      events: [
        {
          id: 'event-1',
          type: 'training',
          timestamp: '2024-01-01T00:00:00Z',
          title: 'Training Run',
          description: null,
          metadata: {
            status: 'pending',
            final_loss: null,
          },
        },
      ],
    };
    
    render(<AdapterTimelineView timeline={pendingTimeline} />);
    
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('handles training event with failed status', () => {
    const failedTimeline: AdapterTimeline = {
      ...mockTimeline,
      events: [
        {
          id: 'event-1',
          type: 'training',
          timestamp: '2024-01-01T00:00:00Z',
          title: 'Training Run',
          description: null,
          metadata: {
            status: 'failed',
            final_loss: null,
          },
        },
      ],
    };
    
    render(<AdapterTimelineView timeline={failedTimeline} />);
    
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('handles version event without active status', () => {
    const inactiveVersionTimeline: AdapterTimeline = {
      ...mockTimeline,
      events: [
        {
          id: 'event-1',
          type: 'version',
          timestamp: '2024-01-01T00:00:00Z',
          title: 'Version 2.0.0',
          description: null,
          metadata: {
            version: '2.0.0',
            is_active: false,
          },
        },
      ],
    };
    
    render(<AdapterTimelineView timeline={inactiveVersionTimeline} />);
    
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });
});
