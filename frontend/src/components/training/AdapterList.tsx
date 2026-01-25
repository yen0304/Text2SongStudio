'use client';

import { memo } from 'react';
import { Adapter, api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdapterListProps {
  adapters: Adapter[];
  isLoading: boolean;
  onToggleActive: (adapter: Adapter) => Promise<void>;
  onViewDetails: (adapter: Adapter) => void;
}

const EmptyState = (
  <div className="text-center py-12 text-muted-foreground">
    <p className="text-lg mb-2">No adapters registered</p>
    <p className="text-sm">Train a model to create your first adapter.</p>
  </div>
);

const LoadingState = (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
    ))}
  </div>
);

function AdapterRow({
  adapter,
  onToggleActive,
  onViewDetails,
}: {
  adapter: Adapter;
  onToggleActive: () => Promise<void>;
  onViewDetails: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{adapter.name}</h3>
              <Badge variant="outline">v{adapter.version}</Badge>
              <Badge variant={adapter.is_active ? 'default' : 'secondary'}>
                {adapter.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {adapter.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {adapter.description}
              </p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Base: {adapter.base_model}</span>
              <span>Created {new Date(adapter.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              Details
            </Button>
            <Button
              variant={adapter.is_active ? 'secondary' : 'default'}
              size="sm"
              onClick={onToggleActive}
            >
              {adapter.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AdapterList = memo(function AdapterList({
  adapters,
  isLoading,
  onToggleActive,
  onViewDetails,
}: AdapterListProps) {
  if (isLoading) {
    return LoadingState;
  }

  if (adapters.length === 0) {
    return EmptyState;
  }

  return (
    <div className="space-y-4">
      {adapters.map((adapter) => (
        <AdapterRow
          key={adapter.id}
          adapter={adapter}
          onToggleActive={() => onToggleActive(adapter)}
          onViewDetails={() => onViewDetails(adapter)}
        />
      ))}
    </div>
  );
});
