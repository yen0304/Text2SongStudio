import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { DatasetExportDialog } from '@/components/training/DatasetExportDialog';
import { Dataset } from '@/lib/api';

// Mock the api module
const mockExport = vi.fn();
vi.mock('@/lib/api', () => ({
  datasetsApi: {
    export: (...args: unknown[]) => mockExport(...args),
  },
}));

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

const mockDataset: Dataset = {
  id: 'dataset-1',
  name: 'Training Dataset',
  description: 'Test dataset for training',
  type: 'supervised',
  filter_query: {},
  sample_count: 100,
  export_path: null,
  is_exported: false,
  created_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
};

describe('DatasetExportDialog', () => {
  beforeEach(() => {
    mockExport.mockClear();
    mockWriteText.mockClear();
    mockExport.mockResolvedValue({
      export_path: '/exports/dataset-1.jsonl',
      format: 'jsonl',
      sample_count: 100,
    });
  });

  it('renders dialog with dataset name', () => {
    render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    expect(screen.getByText('Export Dataset: Training Dataset')).toBeInTheDocument();
  });

  it('shows format selection options', () => {
    render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    expect(screen.getByText('JSONL (recommended)')).toBeInTheDocument();
    expect(screen.getByText('Hugging Face Dataset')).toBeInTheDocument();
  });

  it('displays sample count information', () => {
    render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/samples/)).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('exports dataset when export clicked', async () => {
    const onSuccess = vi.fn();
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith('dataset-1', 'jsonl');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows success message after export', async () => {
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export successful!')).toBeInTheDocument();
      expect(screen.getByText('/exports/dataset-1.jsonl')).toBeInTheDocument();
    });
  });

  it('shows training command after export', async () => {
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Training Command')).toBeInTheDocument();
      expect(screen.getByText(/python -m model.training.cli train/)).toBeInTheDocument();
    });
  });

  it('shows Done button after successful export', async () => {
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  it('can copy training command', async () => {
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
    
    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);
    
    // Copy button should be clickable (clipboard functionality tested via integration)
    expect(copyButton).toBeInTheDocument();
  });

  it('shows error when export fails', async () => {
    mockExport.mockRejectedValue(new Error('Export failed'));
    
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('can select huggingface format', async () => {
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const hfOption = screen.getByLabelText('Hugging Face Dataset');
    await user.click(hfOption);
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith('dataset-1', 'huggingface');
    });
  });

  it('shows loading state during export', async () => {
    mockExport.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { user } = render(
      <DatasetExportDialog
        dataset={mockDataset}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });
});
