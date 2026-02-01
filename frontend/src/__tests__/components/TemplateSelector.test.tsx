import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { TemplateSelector } from '@/components/TemplateSelector';

// Mock the api module
const mockList = vi.fn();
vi.mock('@/lib/api', () => ({
  templatesApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

const mockSystemTemplate = {
  id: 'template-1',
  name: 'Electronic Dance',
  description: 'High energy electronic dance music',
  text: 'Create an energetic electronic dance track',
  attributes: { style: 'electronic', tempo: 128 },
  category: 'electronic',
  is_system: true,
  user_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockUserTemplate = {
  id: 'template-2',
  name: 'My Jazz',
  description: 'Custom jazz template',
  text: 'Smooth jazz with piano',
  attributes: { style: 'jazz', tempo: 90 },
  category: 'jazz',
  is_system: false,
  user_id: 'user-1',
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('TemplateSelector', () => {
  const mockOnSelectTemplate = vi.fn();
  const mockOnSaveAsTemplate = vi.fn();

  beforeEach(() => {
    mockList.mockClear();
    mockOnSelectTemplate.mockClear();
    mockOnSaveAsTemplate.mockClear();
    mockList.mockResolvedValue({ items: [mockSystemTemplate, mockUserTemplate], total: 2, page: 1, limit: 100 });
  });

  it('renders template selector button', async () => {
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    expect(button).toBeInTheDocument();
  });

  it('loads templates on mount', async () => {
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith({ limit: 100 });
    });
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('System Templates')).toBeInTheDocument();
    });
  });

  it('shows system templates section', async () => {
    const user = userEvent.setup();
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('System Templates')).toBeInTheDocument();
      expect(screen.getByText('Electronic Dance')).toBeInTheDocument();
    });
  });

  it('shows user templates section', async () => {
    const user = userEvent.setup();
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('My Templates')).toBeInTheDocument();
      expect(screen.getByText('My Jazz')).toBeInTheDocument();
    });
  });

  it('calls onSelectTemplate when template is clicked', async () => {
    const user = userEvent.setup();
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Electronic Dance')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Electronic Dance'));
    
    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockSystemTemplate);
  });

  it('shows save as template option when callback provided', async () => {
    const user = userEvent.setup();
    render(
      <TemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        onSaveAsTemplate={mockOnSaveAsTemplate}
        canSaveAsTemplate={true}
      />
    );
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Save Current as Template')).toBeInTheDocument();
    });
  });

  it('disables save option when canSaveAsTemplate is false', async () => {
    const user = userEvent.setup();
    render(
      <TemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        onSaveAsTemplate={mockOnSaveAsTemplate}
        canSaveAsTemplate={false}
      />
    );
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Enter prompt text to save template')).toBeInTheDocument();
    });
  });

  it('handles empty template list', async () => {
    mockList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 100 });
    const user = userEvent.setup();
    
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('No templates available')).toBeInTheDocument();
    });
  });

  it('respects disabled prop', async () => {
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} disabled={true} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button', { name: /templates/i });
    expect(button).toBeDisabled();
  });

  it('handles api error gracefully', async () => {
    mockList.mockRejectedValue(new Error('Network error'));
    
    render(<TemplateSelector onSelectTemplate={mockOnSelectTemplate} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    
    // Should not crash
    const button = screen.getByRole('button', { name: /templates/i });
    expect(button).toBeInTheDocument();
  });
});
