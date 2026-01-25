import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { DatasetList } from '@/components/training/DatasetList';
import { createMockDataset } from '@/__mocks__/api';

describe('DatasetList', () => {
  const mockOnExport = vi.fn();
  const mockOnViewStats = vi.fn();

  const mockDatasets = [
    createMockDataset({ id: 'dataset-1', name: 'Training Data v1', type: 'supervised', sample_count: 100 }),
    createMockDataset({ id: 'dataset-2', name: 'Preference Data', type: 'preference', sample_count: 50 }),
    createMockDataset({ id: 'dataset-3', name: 'Exported Data', type: 'supervised', export_path: '/exports/data', sample_count: 75 }),
  ];

  beforeEach(() => {
    mockOnExport.mockClear();
    mockOnViewStats.mockClear();
  });

  it('renders dataset list', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getByText('Training Data v1')).toBeInTheDocument();
    expect(screen.getByText('Preference Data')).toBeInTheDocument();
    expect(screen.getByText('Exported Data')).toBeInTheDocument();
  });

  it('shows dataset type badges', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getAllByText('supervised')).toHaveLength(2);
    expect(screen.getByText('preference')).toBeInTheDocument();
  });

  it('shows exported badge for exported datasets', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getByText('Exported')).toBeInTheDocument();
  });

  it('shows sample count for each dataset', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getByText('100 samples')).toBeInTheDocument();
    expect(screen.getByText('50 samples')).toBeInTheDocument();
    expect(screen.getByText('75 samples')).toBeInTheDocument();
  });

  it('renders export button for each dataset', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    const exportButtons = screen.getAllByRole('button', { name: /export/i });
    expect(exportButtons.length).toBeGreaterThanOrEqual(mockDatasets.length);
  });

  it('renders stats button for each dataset', () => {
    render(
      <DatasetList 
        datasets={mockDatasets} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    const statsButtons = screen.getAllByRole('button', { name: /stats/i });
    expect(statsButtons).toHaveLength(mockDatasets.length);
  });

  it('calls onExport when export button clicked', async () => {
    const { user } = render(
      <DatasetList 
        datasets={[mockDatasets[0]]} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    expect(mockOnExport).toHaveBeenCalledWith(mockDatasets[0]);
  });

  it('calls onViewStats when stats button clicked', async () => {
    const { user } = render(
      <DatasetList 
        datasets={[mockDatasets[0]]} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    const statsButton = screen.getByRole('button', { name: /stats/i });
    await user.click(statsButton);
    
    expect(mockOnViewStats).toHaveBeenCalledWith(mockDatasets[0]);
  });

  it('shows empty state when no datasets', () => {
    render(
      <DatasetList 
        datasets={[]} 
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getByText(/no datasets/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <DatasetList 
        datasets={[]} 
        isLoading={true} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    // Should show loading skeletons
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows Re-export text for already exported datasets', () => {
    render(
      <DatasetList 
        datasets={[mockDatasets[2]]} // The exported one
        isLoading={false} 
        onExport={mockOnExport} 
        onViewStats={mockOnViewStats} 
      />
    );
    
    expect(screen.getByText('Re-export')).toBeInTheDocument();
  });
});

import { beforeEach } from 'vitest';
