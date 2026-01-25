'use client';

import { useState, memo } from 'react';
import { Dataset } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatasetListProps {
  datasets: Dataset[];
  isLoading: boolean;
  onExport: (dataset: Dataset) => void;
  onViewStats: (dataset: Dataset) => void;
}

const EmptyState = (
  <div className="text-center py-12 text-muted-foreground">
    <p className="text-lg mb-2">No datasets yet</p>
    <p className="text-sm">Create a dataset from your feedback to start training.</p>
  </div>
);

const LoadingState = (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
    ))}
  </div>
);

function DatasetRow({ 
  dataset, 
  onExport, 
  onViewStats 
}: { 
  dataset: Dataset; 
  onExport: () => void;
  onViewStats: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{dataset.name}</h3>
              <Badge variant={dataset.type === 'supervised' ? 'default' : 'secondary'}>
                {dataset.type}
              </Badge>
              {dataset.export_path && (
                <Badge variant="outline" className="text-green-600">
                  Exported
                </Badge>
              )}
            </div>
            {dataset.description && (
              <p className="text-sm text-muted-foreground">{dataset.description}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{dataset.sample_count} samples</span>
              <span>Created {new Date(dataset.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewStats}>
              Stats
            </Button>
            <Button 
              variant={dataset.export_path ? 'outline' : 'default'} 
              size="sm" 
              onClick={onExport}
            >
              {dataset.export_path ? 'Re-export' : 'Export'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const DatasetList = memo(function DatasetList({ 
  datasets, 
  isLoading, 
  onExport,
  onViewStats,
}: DatasetListProps) {
  if (isLoading) {
    return LoadingState;
  }

  if (datasets.length === 0) {
    return EmptyState;
  }

  return (
    <div className="space-y-4">
      {datasets.map((dataset) => (
        <DatasetRow 
          key={dataset.id} 
          dataset={dataset} 
          onExport={() => onExport(dataset)}
          onViewStats={() => onViewStats(dataset)}
        />
      ))}
    </div>
  );
});
