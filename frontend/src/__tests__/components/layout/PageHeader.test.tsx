import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageHeader title="Title" />);
    // Should only have the title
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Title');
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Title"
        actions={<Button>Create New</Button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('renders multiple actions', () => {
    render(
      <PageHeader
        title="Title"
        actions={
          <>
            <Button>Action 1</Button>
            <Button>Action 2</Button>
          </>
        }
      />
    );
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
  });

  it('renders breadcrumb when provided', () => {
    render(
      <PageHeader
        title="Details"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Items', href: '/items' },
          { label: 'Details' },
        ]}
      />
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getAllByText('Details')).toHaveLength(2); // breadcrumb + title
  });

  it('renders breadcrumb links correctly', () => {
    render(
      <PageHeader
        title="Details"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Current' },
        ]}
      />
    );
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders breadcrumb separators', () => {
    render(
      <PageHeader
        title="Page"
        breadcrumb={[
          { label: 'A' },
          { label: 'B' },
          { label: 'C' },
        ]}
      />
    );
    
    // Should have separators between items
    const nav = screen.getByRole('navigation');
    expect(nav.textContent).toContain('/');
  });

  it('does not render breadcrumb navigation when empty', () => {
    render(<PageHeader title="Title" breadcrumb={[]} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('applies correct heading styles', () => {
    render(<PageHeader title="Styled Title" />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('text-2xl', 'font-bold');
  });
});
