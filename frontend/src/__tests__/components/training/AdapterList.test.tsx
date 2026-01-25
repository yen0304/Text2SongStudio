import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { AdapterList } from '@/components/training/AdapterList';
import { Adapter } from '@/lib/api';

const mockAdapters: Adapter[] = [
  {
    id: 'adapter-1',
    name: 'MusicGen Fine-tuned',
    description: 'Fine-tuned for classical music',
    base_model: 'musicgen-small',
    status: 'active',
    current_version: '1.0.0',
    config: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'adapter-2',
    name: 'Jazz Adapter',
    description: null,
    base_model: 'musicgen-medium',
    status: 'active',
    current_version: null,
    config: null,
    is_active: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: null,
  },
];

describe('AdapterList', () => {
  it('renders adapter list', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('MusicGen Fine-tuned')).toBeInTheDocument();
    expect(screen.getByText('Jazz Adapter')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <AdapterList
        adapters={[]}
        isLoading={true}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    // Should show animated pulse elements
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no adapters', () => {
    render(
      <AdapterList
        adapters={[]}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('No adapters registered')).toBeInTheDocument();
    expect(screen.getByText('Train a model to create your first adapter.')).toBeInTheDocument();
  });

  it('displays adapter version', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('displays adapter status badges', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows description when available', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('Fine-tuned for classical music')).toBeInTheDocument();
  });

  it('displays base model information', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('Base: musicgen-small')).toBeInTheDocument();
    expect(screen.getByText('Base: musicgen-medium')).toBeInTheDocument();
  });

  it('calls onToggleActive when toggle button clicked', async () => {
    const onToggleActive = vi.fn().mockResolvedValue(undefined);
    const { user } = render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={onToggleActive}
        onViewDetails={vi.fn()}
      />
    );
    
    // Find deactivate button (for active adapter)
    const deactivateButton = screen.getByText('Deactivate');
    await user.click(deactivateButton);
    
    expect(onToggleActive).toHaveBeenCalledWith(mockAdapters[0]);
  });

  it('calls onViewDetails when details button clicked', async () => {
    const onViewDetails = vi.fn();
    const { user } = render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={onViewDetails}
      />
    );
    
    // Find first details button
    const detailsButtons = screen.getAllByText('Details');
    await user.click(detailsButtons[0]);
    
    expect(onViewDetails).toHaveBeenCalledWith(mockAdapters[0]);
  });

  it('shows Activate button for inactive adapters', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  it('displays creation date', () => {
    render(
      <AdapterList
        adapters={mockAdapters}
        isLoading={false}
        onToggleActive={vi.fn()}
        onViewDetails={vi.fn()}
      />
    );
    
    // Check that created date is formatted and shown
    expect(screen.getByText(/Created 1\/1\/2024/)).toBeInTheDocument();
  });
});
