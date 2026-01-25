'use client';

import { useState } from 'react';
import { useDatasets } from '@/hooks/useDatasets';
import { useAdapters } from '@/hooks/useAdapters';
import { useFeedbackStats } from '@/hooks/useFeedbackStats';
import { api, Dataset, Adapter } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DatasetList } from './DatasetList';
import { DatasetCreateForm } from './DatasetCreateForm';
import { DatasetExportDialog } from './DatasetExportDialog';
import { AdapterList } from './AdapterList';
import { AdapterCard } from './AdapterCard';
import { FeedbackStatsDisplay } from './FeedbackStatsDisplay';
import { TrainingReadiness } from './TrainingReadiness';

type TabType = 'datasets' | 'adapters' | 'progress';

export function TrainingDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('datasets');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [exportingDataset, setExportingDataset] = useState<Dataset | null>(null);
  const [selectedAdapter, setSelectedAdapter] = useState<Adapter | null>(null);

  const { datasets, isLoading: datasetsLoading, refresh: refreshDatasets } = useDatasets();
  const { adapters, isLoading: adaptersLoading, refresh: refreshAdapters } = useAdapters();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useFeedbackStats();

  const handleToggleAdapter = async (adapter: Adapter) => {
    try {
      await api.updateAdapter(adapter.id, { is_active: !adapter.is_active });
      refreshAdapters();
      if (selectedAdapter?.id === adapter.id) {
        setSelectedAdapter(null);
      }
    } catch (err) {
      console.error('Failed to toggle adapter:', err);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'datasets', label: 'Datasets' },
    { id: 'adapters', label: 'Adapters' },
    { id: 'progress', label: 'Progress' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Datasets</h2>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Dataset
            </Button>
          </div>

          {showCreateForm ? (
            <DatasetCreateForm
              onSuccess={() => {
                setShowCreateForm(false);
                refreshDatasets();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <DatasetList
              datasets={datasets}
              isLoading={datasetsLoading}
              onExport={(dataset) => setExportingDataset(dataset)}
              onViewStats={() => {}}
            />
          )}

          {exportingDataset && (
            <DatasetExportDialog
              dataset={exportingDataset}
              onClose={() => setExportingDataset(null)}
              onSuccess={() => refreshDatasets()}
            />
          )}
        </div>
      )}

      {/* Adapters Tab */}
      {activeTab === 'adapters' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">LoRA Adapters</h2>
          </div>

          <AdapterList
            adapters={adapters}
            isLoading={adaptersLoading}
            onToggleActive={handleToggleAdapter}
            onViewDetails={(adapter) => setSelectedAdapter(adapter)}
          />

          {selectedAdapter && (
            <AdapterCard
              adapter={selectedAdapter}
              onClose={() => setSelectedAdapter(null)}
              onToggleActive={async () => {
                await handleToggleAdapter(selectedAdapter);
              }}
            />
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Feedback Progress</h2>
          
          <TrainingReadiness
            stats={stats}
            isLoading={statsLoading}
            onCreateDataset={() => {
              setActiveTab('datasets');
              setShowCreateForm(true);
            }}
          />

          <FeedbackStatsDisplay stats={stats} isLoading={statsLoading} />
        </div>
      )}
    </div>
  );
}
