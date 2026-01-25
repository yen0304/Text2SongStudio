import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { TrainingDashboard } from '@/components/training/TrainingDashboard';

// Mock hooks
const mockUseDatasets = vi.fn();
const mockUseAdapters = vi.fn();
const mockUseFeedbackStats = vi.fn();
const mockAdaptersApiUpdate = vi.fn();

vi.mock('@/hooks/useDatasets', () => ({
  useDatasets: () => mockUseDatasets(),
}));

vi.mock('@/hooks/useAdapters', () => ({
  useAdapters: () => mockUseAdapters(),
}));

vi.mock('@/hooks/useFeedbackStats', () => ({
  useFeedbackStats: () => mockUseFeedbackStats(),
}));

vi.mock('@/lib/api', () => ({
  adaptersApi: {
    update: (...args: unknown[]) => mockAdaptersApiUpdate(...args),
  },
}));

const mockDatasets = [
  {
    id: 'dataset-1',
    name: 'Test Dataset',
    description: 'Test description',
    type: 'supervised',
    sample_count: 100,
    status: 'ready',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockAdapters = [
  {
    id: 'adapter-1',
    name: 'Test Adapter',
    description: 'Test adapter description',
    base_model: 'musicgen-small',
    status: 'active',
    current_version: '1.0.0',
    config: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
  },
];

const mockStats = {
  total_feedback: 100,
  total_ratings: 80,
  total_preferences: 20,
  high_rated_samples: 60,
  rating_distribution: { '1': 5, '2': 5, '3': 10, '4': 30, '5': 30 },
};

describe('TrainingDashboard', () => {
  beforeEach(() => {
    mockUseDatasets.mockReturnValue({
      datasets: mockDatasets,
      isLoading: false,
      refresh: vi.fn(),
    });
    mockUseAdapters.mockReturnValue({
      adapters: mockAdapters,
      isLoading: false,
      refresh: vi.fn(),
    });
    mockUseFeedbackStats.mockReturnValue({
      stats: mockStats,
      isLoading: false,
      refresh: vi.fn(),
    });
    mockAdaptersApiUpdate.mockResolvedValue({});
  });

  it('renders dashboard with tabs', () => {
    render(<TrainingDashboard />);
    
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Adapters')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('shows datasets tab by default', () => {
    render(<TrainingDashboard />);
    
    expect(screen.getByText('Training Datasets')).toBeInTheDocument();
    expect(screen.getByText('Create Dataset')).toBeInTheDocument();
  });

  it('shows dataset list on datasets tab', () => {
    render(<TrainingDashboard />);
    
    expect(screen.getByText('Test Dataset')).toBeInTheDocument();
  });

  it('switches to adapters tab', async () => {
    const { user } = render(<TrainingDashboard />);
    
    const adaptersTab = screen.getByRole('button', { name: 'Adapters' });
    await user.click(adaptersTab);
    
    expect(screen.getByText('LoRA Adapters')).toBeInTheDocument();
    expect(screen.getByText('Test Adapter')).toBeInTheDocument();
  });

  it('switches to progress tab', async () => {
    const { user } = render(<TrainingDashboard />);
    
    const progressTab = screen.getByRole('button', { name: 'Progress' });
    await user.click(progressTab);
    
    expect(screen.getByText('Feedback Progress')).toBeInTheDocument();
  });

  it('shows create dataset form when button clicked', async () => {
    const { user } = render(<TrainingDashboard />);
    
    const createButton = screen.getByText('Create Dataset');
    await user.click(createButton);
    
    // Form should be shown
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles loading state for datasets', () => {
    mockUseDatasets.mockReturnValue({
      datasets: [],
      isLoading: true,
      refresh: vi.fn(),
    });
    
    const { container } = render(<TrainingDashboard />);
    
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles loading state for adapters', async () => {
    mockUseAdapters.mockReturnValue({
      adapters: [],
      isLoading: true,
      refresh: vi.fn(),
    });
    
    const { user, container } = render(<TrainingDashboard />);
    
    const adaptersTab = screen.getByRole('button', { name: 'Adapters' });
    await user.click(adaptersTab);
    
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles adapter toggle', async () => {
    const refreshAdapters = vi.fn();
    mockUseAdapters.mockReturnValue({
      adapters: mockAdapters,
      isLoading: false,
      refresh: refreshAdapters,
    });
    
    const { user } = render(<TrainingDashboard />);
    
    // Switch to adapters tab
    const adaptersTab = screen.getByRole('button', { name: 'Adapters' });
    await user.click(adaptersTab);
    
    // Click deactivate button
    const deactivateButton = screen.getByText('Deactivate');
    await user.click(deactivateButton);
    
    await waitFor(() => {
      expect(mockAdaptersApiUpdate).toHaveBeenCalledWith('adapter-1', { is_active: false });
      expect(refreshAdapters).toHaveBeenCalled();
    });
  });

  it('shows empty states correctly', () => {
    mockUseDatasets.mockReturnValue({
      datasets: [],
      isLoading: false,
      refresh: vi.fn(),
    });
    
    render(<TrainingDashboard />);
    
    expect(screen.getByText('No datasets yet')).toBeInTheDocument();
  });

  it('displays feedback stats on progress tab', async () => {
    const { user } = render(<TrainingDashboard />);
    
    const progressTab = screen.getByRole('button', { name: 'Progress' });
    await user.click(progressTab);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
  });
});
