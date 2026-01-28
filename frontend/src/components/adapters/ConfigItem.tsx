'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfigItemProps {
  label: string;
  value: unknown;
  tooltip?: string;
  formatValue?: (value: unknown) => string;
}

/**
 * Single configuration parameter display with optional tooltip
 * Shows label, formatted value, and info icon with hover explanation
 */
export function ConfigItem({ label, value, tooltip, formatValue }: ConfigItemProps) {
  const displayValue = formatConfigValue(value, formatValue);

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
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
      <span className={`text-sm font-mono ${value === undefined || value === null ? 'text-muted-foreground/50 italic' : ''}`}>
        {displayValue}
      </span>
    </div>
  );
}

/**
 * Format configuration values for display
 */
function formatConfigValue(value: unknown, customFormat?: (value: unknown) => string): string {
  if (value === undefined || value === null) {
    return 'Not set';
  }

  if (customFormat) {
    return customFormat(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'number') {
    // Scientific notation for very small numbers
    if (value !== 0 && Math.abs(value) < 0.001) {
      return value.toExponential(1);
    }
    // Round to reasonable precision
    if (!Number.isInteger(value)) {
      return value.toPrecision(4).replace(/\.?0+$/, '');
    }
    return String(value);
  }

  return String(value);
}
