import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';

// Mock xterm - must be before component import and use factory functions
vi.mock('@xterm/xterm', () => {
  const MockTerminal = vi.fn(function(this: Record<string, unknown>) {
    this.loadAddon = vi.fn();
    this.open = vi.fn();
    this.write = vi.fn();
    this.clear = vi.fn();
    this.scrollToBottom = vi.fn();
    this.dispose = vi.fn();
  });
  return { Terminal: MockTerminal };
});

vi.mock('@xterm/addon-fit', () => {
  const MockFitAddon = vi.fn(function(this: Record<string, unknown>) {
    this.fit = vi.fn();
  });
  return { FitAddon: MockFitAddon };
});

vi.mock('@xterm/xterm/css/xterm.css', () => ({}));

// Mock logsApi
const mockGetLogs = vi.fn();
const mockCreateLogStream = vi.fn();
const mockParseSSEEvent = vi.fn();

vi.mock('@/lib/api/modules/logs', () => ({
  logsApi: {
    getLogs: (...args: unknown[]) => mockGetLogs(...args),
    createLogStream: (...args: unknown[]) => mockCreateLogStream(...args),
    parseSSEEvent: (...args: unknown[]) => mockParseSSEEvent(...args),
  },
}));

// Import component after mocks are set up
import { TrainingLogViewer } from '@/components/training/TrainingLogViewer';

describe('TrainingLogViewer', () => {
  const mockRunId = 'test-run-123';
  let mockEventSource: {
    addEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: (() => void) | null;
    onerror: (() => void) | null;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock responses
    mockGetLogs.mockResolvedValue({
      run_id: mockRunId,
      data: '',
      size: 0,
      updated_at: new Date().toISOString(),
    });

    mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onerror: null,
    };
    mockCreateLogStream.mockReturnValue(mockEventSource);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the component with header', async () => {
    render(<TrainingLogViewer runId={mockRunId} />);

    expect(screen.getByText('Training Logs')).toBeInTheDocument();
  });

  it('shows "Completed" badge when not live', async () => {
    render(<TrainingLogViewer runId={mockRunId} isLive={false} />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('shows connecting indicator when live', async () => {
    render(<TrainingLogViewer runId={mockRunId} isLive={true} />);

    // Should show connecting until eventSource.onopen is called
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  it('loads log history on mount', async () => {
    render(<TrainingLogViewer runId={mockRunId} />);

    await waitFor(() => {
      expect(mockGetLogs).toHaveBeenCalledWith(mockRunId);
    });
  });

  it('creates SSE connection when live', async () => {
    render(<TrainingLogViewer runId={mockRunId} isLive={true} />);

    await waitFor(() => {
      expect(mockCreateLogStream).toHaveBeenCalledWith(mockRunId);
    });
  });

  it('does not create SSE connection when not live', async () => {
    render(<TrainingLogViewer runId={mockRunId} isLive={false} />);

    await waitFor(() => {
      expect(mockGetLogs).toHaveBeenCalled();
    });

    expect(mockCreateLogStream).not.toHaveBeenCalled();
  });

  it('has auto-scroll checkbox', async () => {
    render(<TrainingLogViewer runId={mockRunId} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('has clear button', async () => {
    render(<TrainingLogViewer runId={mockRunId} />);

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('applies custom height', async () => {
    const { container } = render(
      <TrainingLogViewer runId={mockRunId} height="600px" />
    );

    // The terminal container should have the custom height
    const terminalDiv = container.querySelector('[style*="height: 600px"]');
    expect(terminalDiv).toBeInTheDocument();
  });

  it('handles error when loading logs fails', async () => {
    mockGetLogs.mockRejectedValue(new Error('Failed to load'));

    render(<TrainingLogViewer runId={mockRunId} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load log history')).toBeInTheDocument();
    });
  });
});

describe('logsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parseSSEEvent parses log event correctly', async () => {
    // Import the real implementation for this test
    const { logsApi } = await vi.importActual<typeof import('@/lib/api/modules/logs')>(
      '@/lib/api/modules/logs'
    );

    const mockEvent = {
      data: '{"chunk": "dGVzdA=="}',
    } as MessageEvent;

    const result = logsApi.parseSSEEvent(mockEvent, 'log');

    expect(result).toEqual({
      type: 'log',
      data: { chunk: 'dGVzdA==' },
    });
  });

  it('parseSSEEvent parses done event correctly', async () => {
    const { logsApi } = await vi.importActual<typeof import('@/lib/api/modules/logs')>(
      '@/lib/api/modules/logs'
    );

    const mockEvent = {
      data: '{"exit_code": 0, "final_size": 1234}',
    } as MessageEvent;

    const result = logsApi.parseSSEEvent(mockEvent, 'done');

    expect(result).toEqual({
      type: 'done',
      data: { exit_code: 0, final_size: 1234 },
    });
  });

  it('parseSSEEvent returns null for invalid JSON', async () => {
    const { logsApi } = await vi.importActual<typeof import('@/lib/api/modules/logs')>(
      '@/lib/api/modules/logs'
    );

    const mockEvent = {
      data: 'invalid json',
    } as MessageEvent;

    const result = logsApi.parseSSEEvent(mockEvent, 'log');

    expect(result).toBeNull();
  });
});
