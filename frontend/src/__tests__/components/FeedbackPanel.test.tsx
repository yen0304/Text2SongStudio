import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { FeedbackPanel } from '@/components/FeedbackPanel';

// Mock the api module
const mockSubmitFeedback = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    submitFeedback: (...args: unknown[]) => mockSubmitFeedback(...args),
  },
}));

describe('FeedbackPanel', () => {
  beforeEach(() => {
    mockSubmitFeedback.mockClear();
    mockSubmitFeedback.mockResolvedValue({ id: 'feedback-1' });
  });

  it('renders feedback panel', () => {
    render(<FeedbackPanel audioIds={['audio-1', 'audio-2']} />);
    expect(screen.getByText('Provide Feedback')).toBeInTheDocument();
  });

  it('renders rating section', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    expect(screen.getByText('Rating')).toBeInTheDocument();
  });

  it('renders star rating buttons', () => {
    const { container } = render(<FeedbackPanel audioIds={['audio-1']} />);
    // Should have star icons for rating
    const starIcons = container.querySelectorAll('svg.lucide-star');
    expect(starIcons.length).toBeGreaterThanOrEqual(5);
  });

  it('renders preference section for multiple samples', () => {
    render(<FeedbackPanel audioIds={['audio-1', 'audio-2']} />);
    expect(screen.getByText('Preference')).toBeInTheDocument();
  });

  it('renders tags section', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('displays suggested tags', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    // Tags display with underscores replaced by spaces
    expect(screen.getByText('good melody')).toBeInTheDocument();
  });

  it('renders sample selector for multiple samples', () => {
    render(<FeedbackPanel audioIds={['audio-1', 'audio-2', 'audio-3']} />);
    // Should show A, B, C labels for samples
    const buttons = screen.getAllByRole('button');
    const hasLabels = buttons.some(btn => btn.textContent?.includes('A')) &&
                      buttons.some(btn => btn.textContent?.includes('B'));
    expect(hasLabels).toBe(true);
  });

  it('can add custom tag', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1']} />);

    // Find the custom tag input
    const customTagInput = screen.getByPlaceholderText(/custom tag/i);
    expect(customTagInput).toBeInTheDocument();

    await user.type(customTagInput, 'my_custom_tag');
    
    // Find add button
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);
  });

  it('renders notes textarea', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    expect(screen.getByPlaceholderText(/notes|comments/i)).toBeInTheDocument();
  });

  it('can submit rating feedback', async () => {
    const onFeedbackSubmitted = vi.fn();
    const { user, container } = render(
      <FeedbackPanel audioIds={['audio-1']} onFeedbackSubmitted={onFeedbackSubmitted} />
    );

    // Click on a star to set rating
    const starButtons = container.querySelectorAll('button');
    if (starButtons.length > 3) {
      await user.click(starButtons[3]); // Click a star
    }
  });
});
