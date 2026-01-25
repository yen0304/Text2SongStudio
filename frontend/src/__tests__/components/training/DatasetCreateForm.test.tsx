import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { DatasetCreateForm } from '@/components/training/DatasetCreateForm';

// Mock the api module
const mockCreate = vi.fn();
const mockPreviewCount = vi.fn();
vi.mock('@/lib/api', () => ({
  datasetsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    previewCount: (...args: unknown[]) => mockPreviewCount(...args),
  },
}));

describe('DatasetCreateForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockCreate.mockClear();
    mockPreviewCount.mockClear();
    mockOnSuccess.mockClear();
    mockOnCancel.mockClear();
    mockCreate.mockResolvedValue({ id: 'dataset-1' });
    mockPreviewCount.mockResolvedValue({ count: 50 });
  });

  it('renders create form', () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByText('Create Training Dataset')).toBeInTheDocument();
  });

  it('renders name input', () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText(/high-quality|name/i)).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
  });

  it('renders dataset type selector', () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    // Should have type options
    expect(screen.getByText('Dataset Type *')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('renders minimum rating slider for supervised type', () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    // Should have rating filter
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
  });

  it('allows entering dataset name', async () => {
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText(/high-quality|name/i);
    await user.type(nameInput, 'My Training Dataset');
    
    expect(nameInput).toHaveValue('My Training Dataset');
  });

  it('shows submit button is disabled when name is empty', async () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Submit button should be disabled when name is empty
    const submitButton = screen.getByRole('button', { name: /create/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText(/high-quality|name/i);
    await user.type(nameInput, 'Test Dataset');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Dataset',
          type: 'supervised',
        })
      );
    });
  });

  it('calls onSuccess after successful creation', async () => {
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText(/high-quality|name/i);
    await user.type(nameInput, 'Test Dataset');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'));
    
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText(/high-quality|name/i);
    await user.type(nameInput, 'Test Dataset');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('previews sample count', async () => {
    render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    await waitFor(() => {
      expect(mockPreviewCount).toHaveBeenCalled();
    });
  });

  it('disables submit button while loading', async () => {
    mockCreate.mockReturnValue(new Promise(() => {})); // Never resolves
    
    const { user } = render(<DatasetCreateForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText(/high-quality|name/i);
    await user.type(nameInput, 'Test Dataset');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Button should be disabled while loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
