'use client';

import { useAdapters } from '@/hooks/useAdapters';
import { Select } from '@/components/ui/select';

interface AdapterSelectorProps {
  value: string | null;
  onChange: (adapterId: string | null) => void;
}

export function AdapterSelector({ value, onChange }: AdapterSelectorProps) {
  const { adapters, isLoading } = useAdapters(true); // Only active adapters

  const options = [
    { value: '', label: 'Base Model (facebook/musicgen-small)' },
    ...adapters.map((adapter) => ({
      value: adapter.id,
      label: `${adapter.name}${adapter.current_version ? ` v${adapter.current_version}` : ''}`,
    })),
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Model Adapter</label>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        options={options}
      />
      <p className="text-xs text-muted-foreground">
        {value ? 'Using custom adapter' : 'Using base model without fine-tuning'}
      </p>
    </div>
  );
}
