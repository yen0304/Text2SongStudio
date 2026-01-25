import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { Select } from '@/components/ui/select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders select element', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={mockOptions} />);
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('has correct option values', () => {
    render(<Select options={mockOptions} />);
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveValue('option1');
    expect(options[1]).toHaveValue('option2');
    expect(options[2]).toHaveValue('option3');
  });

  it('calls onChange when selection changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Select options={mockOptions} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays selected value', () => {
    render(<Select options={mockOptions} value="option2" onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={mockOptions} disabled data-testid="select" />);
    expect(screen.getByTestId('select')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Select options={mockOptions} className="custom-class" data-testid="select" />);
    expect(screen.getByTestId('select')).toHaveClass('custom-class');
  });

  it('applies base styling classes', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Select options={mockOptions} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('renders empty options array', () => {
    render(<Select options={[]} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
