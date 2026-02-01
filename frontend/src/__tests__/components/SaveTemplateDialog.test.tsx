import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';

// Mock the api module
const mockCreate = vi.fn();
vi.mock('@/lib/api', () => ({
  templatesApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

describe('SaveTemplateDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSaved = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    promptText: 'Test prompt text',
    attributes: { style: 'electronic', tempo: 120 },
  };

  beforeEach(() => {
    mockCreate.mockClear();
    mockOnOpenChange.mockClear();
    mockOnSaved.mockClear();
    mockCreate.mockResolvedValue({ id: 'template-1', name: 'Test Template' });
  });

  it('renders dialog when open', () => {
    render(<SaveTemplateDialog {...defaultProps} />);
    
    expect(screen.getByText('Save as Template')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SaveTemplateDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Save as Template')).not.toBeInTheDocument();
  });

  it('shows error when name is empty', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Template name is required')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows error when prompt text is empty', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} promptText="" />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Template');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    expect(screen.getByText(/prompt text is required/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls create api with correct data', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} onSaved={mockOnSaved} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Template');
    
    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'My description');
    
    const categoryInput = screen.getByLabelText(/category/i);
    await user.type(categoryInput, 'electronic');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'My Template',
        description: 'My description',
        text: 'Test prompt text',
        attributes: { style: 'electronic', tempo: 120 },
        category: 'electronic',
      });
    });
  });

  it('closes dialog on successful save', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} onSaved={mockOnSaved} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Template');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
    
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it('shows error on api failure', async () => {
    mockCreate.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Template');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
    
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows loading state while saving', async () => {
    mockCreate.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: '1' }), 100)));
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Template');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup();
    render(<SaveTemplateDialog {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, '  My Template  ');
    
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Template',
        })
      );
    });
  });
});
