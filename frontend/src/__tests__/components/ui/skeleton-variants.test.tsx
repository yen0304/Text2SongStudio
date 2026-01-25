import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import { 
  CardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  PageHeaderSkeleton,
  ChartSkeleton,
  PipelineSkeleton,
  AudioPlayerSkeleton,
  PageSkeleton,
  ListItemSkeleton,
  ActivityFeedSkeleton,
} from '@/components/ui/skeleton';

describe('CardSkeleton', () => {
  it('renders card skeleton', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('TableSkeleton', () => {
  it('renders default table skeleton', () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('renders custom number of rows and columns', () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });
});

describe('PageHeaderSkeleton', () => {
  it('renders page header skeleton', () => {
    const { container } = render(<PageHeaderSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('ChartSkeleton', () => {
  it('renders chart skeleton', () => {
    const { container } = render(<ChartSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('PipelineSkeleton', () => {
  it('renders pipeline skeleton', () => {
    const { container } = render(<PipelineSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('AudioPlayerSkeleton', () => {
  it('renders audio player skeleton', () => {
    const { container } = render(<AudioPlayerSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('PageSkeleton', () => {
  it('renders full page skeleton', () => {
    const { container } = render(<PageSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('ListItemSkeleton', () => {
  it('renders list item skeleton', () => {
    const { container } = render(<ListItemSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('ActivityFeedSkeleton', () => {
  it('renders default activity feed skeleton', () => {
    const { container } = render(<ActivityFeedSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders custom number of items', () => {
    const { container } = render(<ActivityFeedSkeleton items={3} />);
    const items = container.querySelectorAll('.border-b');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });
});
