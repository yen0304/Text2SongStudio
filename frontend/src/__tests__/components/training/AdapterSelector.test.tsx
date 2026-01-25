import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { AdapterSelector } from '@/components/training/AdapterSelector';

// Mock the useAdapters hook
vi.mock('@/hooks/useAdapters', () => ({
  useAdapters: vi.fn(() => ({
    adapters: [
      { id: 'adapter-1', name: 'Classical', current_version: '1.0.0' },
      { id: 'adapter-2', name: 'Jazz', current_version: '2.0.0' },
    ],
    isLoading: false,
    error: null,
  })),
}));

describe('AdapterSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders adapter selector', () => {
    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    expect(screen.getByText('Model Adapter')).toBeInTheDocument();
  });

  it('renders base model option', () => {
    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Base model should be an option
    const options = screen.getAllByRole('option');
    expect(options.some(opt => opt.textContent?.includes('Base Model'))).toBe(true);
  });

  it('renders adapter options', () => {
    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    
    const options = screen.getAllByRole('option');
    expect(options.some(opt => opt.textContent?.includes('Classical'))).toBe(true);
    expect(options.some(opt => opt.textContent?.includes('Jazz'))).toBe(true);
  });

  it('shows version in adapter options', () => {
    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    
    const options = screen.getAllByRole('option');
    expect(options.some(opt => opt.textContent?.includes('v1.0.0'))).toBe(true);
    expect(options.some(opt => opt.textContent?.includes('v2.0.0'))).toBe(true);
  });

  it('calls onChange when selection changes', async () => {
    const { user } = render(<AdapterSelector value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'adapter-1');
    
    expect(mockOnChange).toHaveBeenCalledWith('adapter-1');
  });

  it('calls onChange with null when base model selected', async () => {
    const { user } = render(<AdapterSelector value="adapter-1" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('shows selected adapter value', () => {
    render(<AdapterSelector value="adapter-1" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('adapter-1');
  });

  it('displays hint text for base model', () => {
    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    expect(screen.getByText(/using base model/i)).toBeInTheDocument();
  });

  it('displays hint text for custom adapter', () => {
    render(<AdapterSelector value="adapter-1" onChange={mockOnChange} />);
    expect(screen.getByText(/using custom adapter/i)).toBeInTheDocument();
  });

  it('disables select when loading', async () => {
    const { useAdapters } = await import('@/hooks/useAdapters');
    vi.mocked(useAdapters).mockReturnValue({
      adapters: [],
      total: 0,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    render(<AdapterSelector value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});
