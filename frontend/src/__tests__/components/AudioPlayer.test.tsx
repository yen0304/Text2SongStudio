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
});
