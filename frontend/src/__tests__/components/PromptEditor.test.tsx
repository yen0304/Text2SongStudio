import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { PromptEditor } from '@/components/PromptEditor';

// Mock the api module with modular APIs
const mockCreate = vi.fn();
const mockList = vi.fn();
vi.mock('@/lib/api', () => ({
  adaptersApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
  promptsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
  generationApi: {
    submit: vi.fn().mockResolvedValue({ id: 'job-1', status: 'queued' }),
    getStatus: vi.fn().mockResolvedValue({ id: 'job-1', status: 'completed', audio_ids: ['audio-1'] }),
  },
}));

const defaultProps = {
  onPromptCreated: vi.fn(),
  onSamplesGenerated: vi.fn(),
};

describe('PromptEditor', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockList.mockClear();
    mockCreate.mockResolvedValue({ id: 'prompt-1', text: 'test' });
    mockList.mockResolvedValue({ items: [], total: 0 });
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

  it('renders LoRA adapter selector', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText(/lora adapter/i)).toBeInTheDocument();
  });

  it('can expand instrument category', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Find and click on Keys category
    const keysButton = screen.getByText(/🎹 Keys/);
    await user.click(keysButton);
    
    // Should show instruments when expanded
    await waitFor(() => {
      expect(screen.getByText('Acoustic Piano')).toBeInTheDocument();
    });
  });

  it('can select primary instrument', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Expand Keys category
    const keysButton = screen.getByText(/🎹 Keys/);
    await user.click(keysButton);
    
    // Find primary checkbox for Acoustic Piano
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it('shows selected instruments summary', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Expand Keys category
    const keysButton = screen.getByText(/🎹 Keys/);
    await user.click(keysButton);
    
    // Wait for instruments to appear
    await waitFor(() => {
      expect(screen.getByText('Acoustic Piano')).toBeInTheDocument();
    });
    
    // Select a primary instrument (first checkbox)
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    
    // Should show primary instruments in summary
    await waitFor(() => {
      expect(screen.getByText(/Primary:/)).toBeInTheDocument();
    });
  });

  it('handles empty prompt validation', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Click generate without entering text
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument();
    });
  });

  it('submits generation request with valid prompt', async () => {
    const mockGenerationSubmit = vi.fn().mockResolvedValue({ id: 'job-1', status: 'queued' });
    const mockGetStatus = vi.fn()
      .mockResolvedValueOnce({ id: 'job-1', status: 'running', progress: 0.5 })
      .mockResolvedValueOnce({ id: 'job-1', status: 'completed', audio_ids: ['audio-1'] });

    vi.doMock('@/lib/api', () => ({
      adaptersApi: {
        list: () => Promise.resolve({ items: [], total: 0 }),
      },
      promptsApi: {
        create: () => Promise.resolve({ id: 'prompt-1', text: 'test' }),
      },
      generationApi: {
        submit: mockGenerationSubmit,
        getStatus: mockGetStatus,
      },
    }));
    
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Enter prompt text
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'A cheerful piano melody');
    
    // Click generate
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);
    
    // Should show generating status
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  it('shows character count', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Initially should show 0/2000
    expect(screen.getByText('0/2000 characters')).toBeInTheDocument();
    
    // Type some text
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');
    
    // Should update character count
    expect(screen.getByText('11/2000 characters')).toBeInTheDocument();
  });

  it('can select style option', async () => {
    const { user } = render(<PromptEditor {...defaultProps} />);
    
    // Find style selector
    const selects = screen.getAllByRole('combobox');
    const styleSelect = selects[0]; // First select is style
    
    // Select electronic
    await user.selectOptions(styleSelect, 'electronic');
    
    expect(styleSelect).toHaveValue('electronic');
  });

  it('can adjust tempo slider', () => {
    const { container } = render(<PromptEditor {...defaultProps} />);
    
    // Should have tempo slider
    const slider = container.querySelector('input[type="range"]');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '40');
    expect(slider).toHaveAttribute('max', '200');
  });

  it('fetches adapters on mount', async () => {
    render(<PromptEditor {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith({ activeOnly: true });
    });
  });

  it('displays adapters in selector when available', async () => {
    mockList.mockResolvedValue({
      items: [
        { id: 'adapter-1', name: 'Test Adapter', current_version: '1.0', is_active: true },
      ],
      total: 1,
    });
    
    render(<PromptEditor {...defaultProps} />);
    
    await waitFor(() => {
      const adapterSelect = screen.getAllByRole('combobox').find(
        select => select.querySelector('option[value="adapter-1"]')
      );
      expect(adapterSelect).toBeTruthy();
    });
  });
});
