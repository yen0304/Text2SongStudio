'use client';

import { Adapter } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface AdapterCardProps {
  adapter: Adapter;
  onClose: () => void;
  onToggleActive: () => Promise<void>;
}

export function AdapterCard({ adapter, onClose, onToggleActive }: AdapterCardProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{adapter.name}</CardTitle>
            {adapter.current_version && <Badge variant="outline">v{adapter.current_version}</Badge>}
            <Badge variant={adapter.is_active ? 'default' : 'secondary'}>
              {adapter.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {adapter.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1">{adapter.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Base Model</label>
              <p className="mt-1 text-sm">{adapter.base_model}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="mt-1 text-sm">
                {new Date(adapter.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {adapter.config && Object.keys(adapter.config).length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Config</label>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(adapter.config, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={adapter.is_active ? 'secondary' : 'default'}
            onClick={onToggleActive}
          >
            {adapter.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
