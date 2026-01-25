import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { PromptEditor } from '@/components/PromptEditor';

// Mock the api module
const mockCreatePrompt = vi.fn();
const mockListAdapters = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    createPrompt: (...args: unknown[]) => mockCreatePrompt(...args),
    listAdapters: (...args: unknown[]) => mockListAdapters(...args),
  },
}));

const defaultProps = {
  onPromptCreated: vi.fn(),
  onSamplesGenerated: vi.fn(),
};

describe('PromptEditor', () => {
  beforeEach(() => {
    mockCreatePrompt.mockClear();
    mockListAdapters.mockClear();
    mockCreatePrompt.mockResolvedValue({ id: 'prompt-1', text: 'test' });
    mockListAdapters.mockResolvedValue({ items: [], total: 0 });
    defaultProps.onPromptCreated.mockClear();
    defaultProps.onSamplesGenerated.mockClear();
  });

  it('renders prompt editor', () => {
    render(<PromptEditor {...defaultProps} />);
    // Should have form elements
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders text input for prompt', () => {
    render(<PromptEditor {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders style selector', () => {
    render(<PromptEditor {...defaultProps} />);
    // Check for select element with Style label
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('renders tempo control', () => {
    render(<PromptEditor {...defaultProps} />);
    const tempoText = screen.getByText(/tempo/i);
    expect(tempoText).toBeInTheDocument();
  });

  it('renders instrumentation section', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText(/instrumentation/i)).toBeInTheDocument();
  });

  it('renders instrument categories', () => {
    render(<PromptEditor {...defaultProps} />);
    // Should show instrument category headers
    expect(screen.getByText(/keys/i)).toBeInTheDocument();
    expect(screen.getByText(/drums/i)).toBeInTheDocument();
  });

  it('allows typing prompt text', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'A cheerful piano melody');
    
    expect(textarea).toHaveValue('A cheerful piano melody');
  });

  it('renders generate button', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('renders number of samples selector', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText(/number of samples/i)).toBeInTheDocument();
  });
});
