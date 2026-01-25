import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { ComparisonPlayer } from '@/components/comparison/ComparisonPlayer';
import { ABTestPair } from '@/lib/api';

// Mock the api module
const mockSubmitVote = vi.fn();
vi.mock('@/lib/api', () => ({
  abTestsApi: {
    submitVote: (...args: unknown[]) => mockSubmitVote(...args),
  },
  audioApi: {
    getStreamUrl: (id: string) => `http://localhost:8000/audio/${id}/stream`,
  },
}));

// Mock HTMLMediaElement methods
window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();

const mockReadyPair: ABTestPair = {
  id: 'pair-1',
  prompt_id: 'prompt-1',
  audio_a_id: 'audio-a-1',
  audio_b_id: 'audio-b-1',
  preference: null,
  voted_at: null,
  is_ready: true,
};

const mockNotReadyPair: ABTestPair = {
  id: 'pair-2',
  prompt_id: 'prompt-1',
  audio_a_id: null,
  audio_b_id: null,
  preference: null,
  voted_at: null,
  is_ready: false,
};

const mockVotedPair: ABTestPair = {
  id: 'pair-3',
  prompt_id: 'prompt-1',
  audio_a_id: 'audio-a-1',
  audio_b_id: 'audio-b-1',
  preference: 'a',
  voted_at: '2024-01-01T00:00:00Z',
  is_ready: true,
};

describe('ComparisonPlayer', () => {
  beforeEach(() => {
    mockSubmitVote.mockClear();
    mockSubmitVote.mockResolvedValue({});
  });

  it('renders player controls when pair is ready', () => {
    render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('Sample A')).toBeInTheDocument();
    expect(screen.getByText('Sample B')).toBeInTheDocument();
    expect(screen.getByText('Which sample sounds better?')).toBeInTheDocument();
  });

  it('renders generating message when pair is not ready', () => {
    render(
      <ComparisonPlayer
        pair={mockNotReadyPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('Generating samples...')).toBeInTheDocument();
  });

  it('shows voted message when pair has been voted', () => {
    render(
      <ComparisonPlayer
        pair={mockVotedPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('Sample A')).toBeInTheDocument();
    expect(screen.getByText(/You voted for/)).toBeInTheDocument();
  });

  it('renders vote buttons', () => {
    render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('A is better')).toBeInTheDocument();
    expect(screen.getByText('Equal')).toBeInTheDocument();
    expect(screen.getByText('B is better')).toBeInTheDocument();
  });

  it('calls onVoted after successful vote', async () => {
    const onVoted = vi.fn();
    const { user } = render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={onVoted}
      />
    );
    
    const voteButton = screen.getByText('A is better');
    await user.click(voteButton);
    
    await waitFor(() => {
      expect(mockSubmitVote).toHaveBeenCalledWith('test-1', 'pair-1', 'a');
      expect(onVoted).toHaveBeenCalled();
    });
  });

  it('submits vote for B', async () => {
    const onVoted = vi.fn();
    const { user } = render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={onVoted}
      />
    );
    
    const voteButton = screen.getByText('B is better');
    await user.click(voteButton);
    
    await waitFor(() => {
      expect(mockSubmitVote).toHaveBeenCalledWith('test-1', 'pair-1', 'b');
    });
  });

  it('submits equal vote', async () => {
    const onVoted = vi.fn();
    const { user } = render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={onVoted}
      />
    );
    
    const voteButton = screen.getByText('Equal');
    await user.click(voteButton);
    
    await waitFor(() => {
      expect(mockSubmitVote).toHaveBeenCalledWith('test-1', 'pair-1', 'equal');
    });
  });

  it('handles vote error gracefully', async () => {
    mockSubmitVote.mockRejectedValue(new Error('Vote failed'));
    const onVoted = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { user } = render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={onVoted}
      />
    );
    
    const voteButton = screen.getByText('A is better');
    await user.click(voteButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('shows click to play instruction', () => {
    render(
      <ComparisonPlayer
        pair={mockReadyPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    const clickToPlayTexts = screen.getAllByText('Click to play');
    expect(clickToPlayTexts.length).toBe(2);
  });

  it('displays voted preference for Sample B', () => {
    const votedBPair: ABTestPair = {
      ...mockVotedPair,
      preference: 'b',
    };
    
    render(
      <ComparisonPlayer
        pair={votedBPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('Sample B')).toBeInTheDocument();
  });

  it('displays voted preference for Equal', () => {
    const votedEqualPair: ABTestPair = {
      ...mockVotedPair,
      preference: 'equal',
    };
    
    render(
      <ComparisonPlayer
        pair={votedEqualPair}
        testId="test-1"
        onVoted={vi.fn()}
      />
    );
    
    expect(screen.getByText('Equal')).toBeInTheDocument();
  });
});
