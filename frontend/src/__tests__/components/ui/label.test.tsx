import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders children correctly', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders with htmlFor attribute', () => {
    render(<Label htmlFor="email">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('applies custom className', () => {
    render(<Label className="custom-class">Custom Label</Label>);
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('custom-class');
  });

  it('applies default styling classes', () => {
    render(<Label>Styled Label</Label>);
    const label = screen.getByText('Styled Label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
