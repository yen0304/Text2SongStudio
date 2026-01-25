import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(
      <ErrorBoundary title="Custom Error Title">
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback content</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom fallback content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows Try again button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onReset when Try again is clicked', async () => {
    const handleReset = vi.fn();
    const { user } = render(
      <ErrorBoundary onReset={handleReset}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);
    
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('handles errors without message', () => {
    function ThrowsEmptyError(): JSX.Element {
      throw new Error();
    }

    render(
      <ErrorBoundary>
        <ThrowsEmptyError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(console.error).toHaveBeenCalled();
  });
});

// Import afterEach from vitest
import { afterEach } from 'vitest';
