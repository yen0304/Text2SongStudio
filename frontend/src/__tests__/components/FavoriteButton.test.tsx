import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { FavoriteButton } from '@/components/FavoriteButton';

// Mock the api module
const mockCheck = vi.fn();
const mockToggle = vi.fn();
vi.mock('@/lib/api', () => ({
  favoritesApi: {
    check: (...args: unknown[]) => mockCheck(...args),
    toggle: (...args: unknown[]) => mockToggle(...args),
  },
}));

describe('FavoriteButton', () => {
  beforeEach(() => {
    mockCheck.mockClear();
    mockToggle.mockClear();
  });

  it('renders unfavorited state initially', async () => {
    mockCheck.mockResolvedValue(null);
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledWith('prompt', 'prompt-1');
    });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders favorited state when item is favorited', async () => {
    mockCheck.mockResolvedValue({ id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' });
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledWith('prompt', 'prompt-1');
    });
  });

  it('toggles favorite state on click', async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(null);
    mockToggle.mockResolvedValue({ id: 'fav-1', target_type: 'prompt', target_id: 'prompt-1' });
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith('prompt', 'prompt-1');
    });
  });

  it('handles audio target type', async () => {
    mockCheck.mockResolvedValue(null);
    
    render(<FavoriteButton targetType="audio" targetId="audio-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledWith('audio', 'audio-1');
    });
  });

  it('shows loading state while toggling', async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(null);
    // Make toggle slow to observe loading state
    mockToggle.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: 'fav-1' }), 100)));
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Button should be disabled during toggle
    expect(button).toBeDisabled();
  });

  it('renders with different sizes', async () => {
    mockCheck.mockResolvedValue(null);
    
    const { rerender } = render(<FavoriteButton targetType="prompt" targetId="prompt-1" size="sm" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled();
    });
    
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Just verify the button renders with different sizes (actual class names depend on Button implementation)
    rerender(<FavoriteButton targetType="prompt" targetId="prompt-1" size="default" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    rerender(<FavoriteButton targetType="prompt" targetId="prompt-1" size="icon" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles check error gracefully', async () => {
    mockCheck.mockRejectedValue(new Error('Network error'));
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    // Should not crash
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles toggle error gracefully', async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(null);
    mockToggle.mockRejectedValue(new Error('Network error'));
    
    render(<FavoriteButton targetType="prompt" targetId="prompt-1" />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled();
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should not crash, button should still be enabled
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
