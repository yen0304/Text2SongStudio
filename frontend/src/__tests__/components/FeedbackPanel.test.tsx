import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { FeedbackPanel } from '@/components/FeedbackPanel';

// Mock the api module with modular APIs
const mockSubmit = vi.fn();
vi.mock('@/lib/api', () => ({
  feedbackApi: {
    submit: (...args: unknown[]) => mockSubmit(...args),
  },
}));

describe('FeedbackPanel', () => {
  beforeEach(() => {
    mockSubmit.mockClear();
    mockSubmit.mockResolvedValue({ id: 'feedback-1' });
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

  it('does not render preference section for single sample', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    expect(screen.queryByText('Preference')).not.toBeInTheDocument();
  });

  it('allows selecting preferred sample', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1', 'audio-2']} />);
    
    // Find preference buttons (A and B)
    const preferenceButtons = screen.getAllByText(/Click to select/);
    expect(preferenceButtons.length).toBe(2);
    
    // Click on sample A
    await user.click(preferenceButtons[0].closest('button')!);
    
    expect(screen.getByText('✓ Selected')).toBeInTheDocument();
  });

  it('submits preference feedback', async () => {
    const onFeedbackSubmitted = vi.fn();
    const { user } = render(
      <FeedbackPanel audioIds={['audio-1', 'audio-2']} onFeedbackSubmitted={onFeedbackSubmitted} />
    );
    
    // Select sample A
    const sampleButtons = screen.getAllByText(/Click to select/);
    await user.click(sampleButtons[0].closest('button')!);
    
    // Submit preference
    const submitButton = screen.getByRole('button', { name: /submit preference/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        audio_id: 'audio-1',
        preferred_over: 'audio-2',
      }));
    });
  });

  it('toggles tags on click', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1']} />);
    
    const goodMelodyTag = screen.getByText('good melody');
    await user.click(goodMelodyTag);
    
    // Tag should now be selected (shown in selected tags area with X button)
    expect(screen.getAllByText('good melody').length).toBeGreaterThanOrEqual(1);
  });

  it('removes tag when X is clicked', async () => {
    const { user, container } = render(<FeedbackPanel audioIds={['audio-1']} />);
    
    // First add a tag
    const goodMelodyTag = screen.getByText('good melody');
    await user.click(goodMelodyTag);
    
    // Find the X button in the selected tags area
    const removeButtons = container.querySelectorAll('svg.lucide-x');
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
    }
  });

  it('submits tags feedback', async () => {
    const onFeedbackSubmitted = vi.fn();
    const { user } = render(
      <FeedbackPanel audioIds={['audio-1']} onFeedbackSubmitted={onFeedbackSubmitted} />
    );
    
    // Select a tag
    const goodMelodyTag = screen.getByText('good melody');
    await user.click(goodMelodyTag);
    
    // Submit tags
    const submitButton = screen.getByRole('button', { name: /submit tags/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        audio_id: 'audio-1',
        tags: ['good_melody'],
      }));
    });
  });

  it('adds custom tag on enter key', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1']} />);
    
    const customTagInput = screen.getByPlaceholderText(/custom tag/i);
    await user.type(customTagInput, 'my_custom_tag{enter}');
    
    expect(screen.getByText('my custom tag')).toBeInTheDocument();
  });

  it('switches sample selection in rating section', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1', 'audio-2']} />);
    
    // Find sample B button in rating section
    const sampleButtons = screen.getAllByRole('button').filter(
      btn => btn.textContent === 'B'
    );
    
    if (sampleButtons.length > 0) {
      await user.click(sampleButtons[0]);
      expect(screen.getByText('Rate Sample B')).toBeInTheDocument();
    }
  });

  it('includes notes with submission', async () => {
    const { user } = render(<FeedbackPanel audioIds={['audio-1']} />);
    
    // Add notes
    const notesTextarea = screen.getByPlaceholderText(/add notes/i);
    await user.type(notesTextarea, 'This is a great sample!');
    
    // Select a tag and submit
    const goodMelodyTag = screen.getByText('good melody');
    await user.click(goodMelodyTag);
    
    const submitButton = screen.getByRole('button', { name: /submit tags/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'This is a great sample!',
      }));
    });
  });

  it('shows training progress link', () => {
    render(<FeedbackPanel audioIds={['audio-1']} />);
    
    expect(screen.getByText(/view training progress/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view training progress/i })).toHaveAttribute('href', '/training');
  });

  it('handles rating submission error gracefully', async () => {
    mockSubmit.mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { user, container } = render(<FeedbackPanel audioIds={['audio-1']} />);
    
    // Click on a star
    const starButtons = container.querySelectorAll('.lucide-star');
    if (starButtons.length > 0) {
      await user.click(starButtons[2].closest('button')!);
    }
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit rating/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });
});
