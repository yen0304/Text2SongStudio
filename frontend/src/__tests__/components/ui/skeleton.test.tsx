import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import { Skeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies pulse animation class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies base styling classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded-md', 'bg-muted');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('h-10', 'w-20');
  });

  it('accepts custom style', () => {
    const { container } = render(<Skeleton style={{ width: '100px' }} />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle({ width: '100px' });
  });
});

describe('CardSkeleton', () => {
  it('renders card skeleton structure', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders inside a card-like container', () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-lg', 'border');
  });
});

describe('TableRowSkeleton', () => {
  it('renders default number of columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    );
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(5);
  });

  it('renders custom number of columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton columns={3} />
        </tbody>
      </table>
    );
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(3);
  });

  it('contains skeleton elements in each cell', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton columns={2} />
        </tbody>
      </table>
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});
