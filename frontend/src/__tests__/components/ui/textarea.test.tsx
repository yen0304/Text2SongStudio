import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts and displays value', () => {
    render(<Textarea value="test value" readOnly />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveClass('custom-class');
  });

  it('applies base styling classes', () => {
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'w-full', 'rounded-md');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={10} data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '10');
  });

  it('supports aria attributes', () => {
    render(<Textarea aria-label="Description" aria-describedby="desc-hint" />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('aria-describedby', 'desc-hint');
  });

  it('handles multiline input', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'line1{enter}line2');
    
    expect(handleChange).toHaveBeenCalled();
  });
});
