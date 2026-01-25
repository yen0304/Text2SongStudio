import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-primary');
  });

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-secondary');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-destructive');
  });

  it('applies outline variant classes', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('applies base badge styling', () => {
    render(<Badge data-testid="badge">Styled</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
  });

  it('renders children of any type', () => {
    render(
      <Badge data-testid="badge">
        <span data-testid="icon">🔔</span>
        Notification
      </Badge>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Notification')).toBeInTheDocument();
  });
});
