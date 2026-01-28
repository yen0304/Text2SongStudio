'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';

interface ConfigFormItemProps {
  label: string;
  name: string;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  tooltip?: string;
  type?: 'number' | 'text' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

/**
 * Form input for a configuration parameter with optional tooltip
 * Used in experiment config forms for setting hyperparameters
 */
export function ConfigFormItem({
  label,
  name,
  value,
  onChange,
  tooltip,
  type = 'text',
  options = [],
  placeholder,
  min,
  max,
  step,
  disabled = false,
}: ConfigFormItemProps) {
  const renderInput = () => {
    switch (type) {
      case 'boolean':
        return (
          <Switch
            id={name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <Select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            options={options}
            className="w-40 h-8 text-sm font-mono"
            disabled={disabled}
          />
        );
      case 'number':
        return (
          <Input
            id={name}
            type="number"
            value={value === undefined ? '' : String(value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onChange(0);
              } else {
                onChange(parseFloat(val));
              }
            }}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className="w-32 h-8 text-sm font-mono text-right"
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            id={name}
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-40 h-8 text-sm font-mono"
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5">
        <label htmlFor={name} className="text-sm text-muted-foreground">
          {label}
        </label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  size={14}
                  className="text-muted-foreground/60 hover:text-muted-foreground cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {renderInput()}
    </div>
  );
}
