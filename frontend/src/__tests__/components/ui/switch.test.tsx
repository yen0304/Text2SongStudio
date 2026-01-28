import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('renders switch component', () => {
    render(<Switch aria-label="Toggle switch" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders unchecked by default', () => {
    render(<Switch aria-label="Toggle switch" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders checked when defaultChecked is true', () => {
    render(<Switch aria-label="Toggle switch" defaultChecked />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'checked');
  });

  it('toggles when clicked', async () => {
    const onCheckedChange = vi.fn();
    const { user } = render(
      <Switch aria-label="Toggle switch" onCheckedChange={onCheckedChange} />
    );
    
    await user.click(screen.getByRole('switch'));
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('applies custom className', () => {
    render(<Switch aria-label="Toggle switch" className="custom-class" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('custom-class');
  });

  it('can be disabled', () => {
    render(<Switch aria-label="Toggle switch" disabled />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<Switch aria-label="Dark mode toggle" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-label', 'Dark mode toggle');
  });
});
