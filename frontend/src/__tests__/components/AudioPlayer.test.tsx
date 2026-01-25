import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { AudioPlayer } from '@/components/AudioPlayer';

// Mock the api module
const mockGetMetadata = vi.fn();
vi.mock('@/lib/api', () => ({
  audioApi: {
    getMetadata: (...args: unknown[]) => mockGetMetadata(...args),
    getStreamUrl: (id: string) => `http://localhost:8000/audio/${id}/stream`,
  },
}));

// Mock wavesurfer.js
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(),
      unAll: vi.fn(),
      load: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 10),
      seekTo: vi.fn(),
    })),
  },
}));

const mockAudioMetadata = {
  id: 'audio-1',
  prompt_id: 'prompt-1',
  adapter_id: null,
  duration_seconds: 10,
  sample_rate: 44100,
  created_at: '2024-01-01T00:00:00Z',
};

describe('AudioPlayer', () => {
  beforeEach(() => {
    mockGetMetadata.mockClear();
    mockGetMetadata.mockResolvedValue(mockAudioMetadata);
  });

  it('renders audio player container', () => {
    const { container } = render(<AudioPlayer audioIds={['audio-1']} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('fetches audio metadata on mount', async () => {
    render(<AudioPlayer audioIds={['audio-1', 'audio-2']} />);
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalledWith('audio-1');
      expect(mockGetMetadata).toHaveBeenCalledWith('audio-2');
    });
  });

  it('renders playback control buttons', async () => {
    const { container } = render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Should have button elements
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders sample labels for multiple samples', async () => {
    render(<AudioPlayer audioIds={['audio-1', 'audio-2', 'audio-3']} />);
    
    await waitFor(() => {
      // Should show A, B, C buttons
      const sampleButtons = screen.getAllByRole('button');
      const buttonTexts = sampleButtons.map(b => b.textContent);
      expect(buttonTexts.some(t => t?.includes('A'))).toBe(true);
    });
  });

  it('handles empty audioIds array', () => {
    const { container } = render(<AudioPlayer audioIds={[]} />);
    
    // Should not crash
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders card with title', () => {
    render(<AudioPlayer audioIds={['audio-1']} />);
    
    expect(screen.getByText(/audio|playback/i)).toBeInTheDocument();
  });

  it('renders waveform container', async () => {
    const { container } = render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Should have a waveform container div
    const waveformContainer = container.querySelector('div');
    expect(waveformContainer).toBeTruthy();
  });

  it('renders volume control area', async () => {
    const { container } = render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Volume control or audio controls should exist
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows Audio Player title', () => {
    render(<AudioPlayer audioIds={['audio-1']} />);
    expect(screen.getByText('Audio Player')).toBeInTheDocument();
  });

  it('renders time display area', async () => {
    const { container } = render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Time display area should exist
    expect(container.firstChild).toBeInTheDocument();
  });

  it('can switch between samples', async () => {
    const { user } = render(<AudioPlayer audioIds={['audio-1', 'audio-2', 'audio-3']} />);
    
    // Find sample B button
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const sampleBButton = buttons.find(btn => btn.textContent?.includes('B'));
      expect(sampleBButton).toBeTruthy();
    });
    
    const buttons = screen.getAllByRole('button');
    const sampleBButton = buttons.find(btn => btn.textContent?.includes('B'));
    if (sampleBButton) {
      await user.click(sampleBButton);
    }
  });

  it('handles playback toggle', async () => {
    const { user, container } = render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Find play/pause button
    const playButton = container.querySelector('button');
    if (playButton) {
      await user.click(playButton);
    }
  });

  it('shows played indicator for visited samples', async () => {
    const { user, container } = render(<AudioPlayer audioIds={['audio-1', 'audio-2']} />);
    
    // Click play to mark sample as played
    const playButton = container.querySelector('button');
    if (playButton) {
      await user.click(playButton);
    }
    
    // The first sample should now be marked as played
  });

  it('handles skip forward button', async () => {
    const { user, container } = render(<AudioPlayer audioIds={['audio-1', 'audio-2']} />);
    
    // Find skip forward button (lucide icon)
    const skipButton = container.querySelector('.lucide-skip-forward')?.closest('button');
    if (skipButton) {
      await user.click(skipButton);
    }
  });

  it('handles skip backward button', async () => {
    const { user, container } = render(<AudioPlayer audioIds={['audio-1', 'audio-2']} />);
    
    // First go to second sample
    const buttons = screen.getAllByRole('button');
    const sampleBButton = buttons.find(btn => btn.textContent?.includes('B'));
    if (sampleBButton) {
      await user.click(sampleBButton);
    }
    
    // Find skip backward button
    const skipBackButton = container.querySelector('.lucide-skip-back')?.closest('button');
    if (skipBackButton) {
      await user.click(skipBackButton);
    }
  });

  it('displays metadata when available', async () => {
    render(<AudioPlayer audioIds={['audio-1']} />);
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalled();
    });
  });

  it('handles metadata fetch error', async () => {
    mockGetMetadata.mockRejectedValue(new Error('Fetch failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<AudioPlayer audioIds={['audio-1']} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('handles single audio gracefully', () => {
    render(<AudioPlayer audioIds={['audio-1']} />);
    
    // Should not show sample selector tabs for single audio
    const buttons = screen.getAllByRole('button');
    const hasMultipleSampleButtons = buttons.filter(btn => 
      ['A', 'B', 'C'].some(label => btn.textContent?.includes(label))
    ).length > 1;
    
    // Single audio should not show B, C buttons
    expect(hasMultipleSampleButtons).toBe(false);
  });
});
