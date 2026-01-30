import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdapterCard } from '@/components/training/AdapterCard';
import { Adapter } from '@/lib/api';

const mockAdapter: Adapter = {
  id: 'adapter-1',
  name: 'Test Adapter',
  base_model: 'musicgen-small',
  base_model_config: null,
  is_active: true,
  description: 'A test adapter for music generation',
  status: 'active',
  current_version: '1.0.0',
  config: {
    learning_rate: 0.001,
    batch_size: 4,
  },
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

describe('AdapterCard', () => {
  it('renders adapter name and version', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('Test Adapter')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('shows Active badge when adapter is active', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows Inactive badge when adapter is not active', () => {
    render(
      <AdapterCard
        adapter={{ ...mockAdapter, is_active: false }}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays adapter description', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('A test adapter for music generation')).toBeInTheDocument();
  });

  it('displays base model', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('musicgen-small')).toBeInTheDocument();
  });

  it('displays config when present', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText(/learning_rate/)).toBeInTheDocument();
    expect(screen.getByText(/batch_size/)).toBeInTheDocument();
  });

  it('hides config section when config is empty', () => {
    render(
      <AdapterCard
        adapter={{ ...mockAdapter, config: {} }}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.queryByText('Config')).not.toBeInTheDocument();
  });

  it('hides description when not provided', () => {
    render(
      <AdapterCard
        adapter={{ ...mockAdapter, description: null }}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={onClose}
        onToggleActive={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleActive when toggle button is clicked', () => {
    const onToggleActive = vi.fn();
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={onToggleActive}
      />
    );

    fireEvent.click(screen.getByText('Deactivate'));

    expect(onToggleActive).toHaveBeenCalledTimes(1);
  });

  it('shows Activate button when adapter is inactive', () => {
    render(
      <AdapterCard
        adapter={{ ...mockAdapter, is_active: false }}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  it('formats creation date correctly', () => {
    render(
      <AdapterCard
        adapter={mockAdapter}
        onClose={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    // Date format depends on locale, just check that a date appears
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });
});
