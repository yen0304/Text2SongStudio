import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { Sidebar } from '@/components/layout/Sidebar';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/overview');
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders navigation items', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Experiments')).toBeInTheDocument();
    expect(screen.getByText('Adapters')).toBeInTheDocument();
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar />);
    
    expect(screen.getByRole('link', { name: /overview/i })).toHaveAttribute('href', '/overview');
    expect(screen.getByRole('link', { name: /generate/i })).toHaveAttribute('href', '/generate');
    expect(screen.getByRole('link', { name: /jobs/i })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('link', { name: /feedback/i })).toHaveAttribute('href', '/feedback');
  });

  it('highlights current route', () => {
    mockUsePathname.mockReturnValue('/jobs');
    render(<Sidebar />);
    
    const jobsLink = screen.getByRole('link', { name: /jobs/i });
    // The active link should have a different styling
    expect(jobsLink.className).toContain('bg-');
  });

  it('renders A/B Tests navigation item', () => {
    render(<Sidebar />);
    expect(screen.getByText('A/B Tests')).toBeInTheDocument();
  });

  it('renders collapse/expand button', () => {
    render(<Sidebar />);
    // Look for the collapse button
    const collapseButton = screen.getByRole('button', { name: /collapse|expand/i });
    expect(collapseButton).toBeInTheDocument();
  });
});
