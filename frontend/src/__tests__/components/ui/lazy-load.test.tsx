import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { LazyLoad, VirtualList, DeferredLoad } from '@/components/ui/lazy-load';

describe('LazyLoad', () => {
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows fallback initially', () => {
    render(
      <LazyLoad fallback={<div>Loading...</div>}>
        <div>Content</div>
      </LazyLoad>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows children when element becomes visible', async () => {
    render(
      <LazyLoad fallback={<div>Loading...</div>}>
        <div>Content</div>
      </LazyLoad>
    );

    // Simulate intersection
    act(() => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('disconnects observer when visible', async () => {
    render(
      <LazyLoad>
        <div>Content</div>
      </LazyLoad>
    );

    act(() => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('uses custom threshold and rootMargin', () => {
    render(
      <LazyLoad threshold={0.5} rootMargin="200px">
        <div>Content</div>
      </LazyLoad>
    );

    expect(mockObserve).toHaveBeenCalled();
  });
});

describe('VirtualList', () => {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);

  beforeEach(() => {
    // Mock clientHeight
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 500,
    });
  });

  it('renders only visible items', () => {
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        renderItem={(item) => <div>{item}</div>}
      />
    );

    // Should render initial visible items (based on container height / itemHeight + overscan)
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 99')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        renderItem={(item) => <div>{item}</div>}
        className="custom-class"
      />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('respects overscan parameter', () => {
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        renderItem={(item) => <div>{item}</div>}
        overscan={5}
      />
    );

    // With higher overscan, more items should be rendered
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('renders with correct total height', () => {
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        renderItem={(item) => <div>{item}</div>}
      />
    );

    const innerDiv = container.querySelector('[style*="height: 5000px"]');
    expect(innerDiv).toBeInTheDocument();
  });
});

describe('DeferredLoad', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows fallback initially', () => {
    render(
      <DeferredLoad fallback={<div>Loading...</div>}>
        <div>Content</div>
      </DeferredLoad>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows children after default delay', async () => {
    render(
      <DeferredLoad fallback={<div>Loading...</div>}>
        <div>Content</div>
      </DeferredLoad>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('respects custom delay', async () => {
    render(
      <DeferredLoad delay={500} fallback={<div>Loading...</div>}>
        <div>Content</div>
      </DeferredLoad>
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders without fallback', async () => {
    render(
      <DeferredLoad>
        <div>Content</div>
      </DeferredLoad>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
