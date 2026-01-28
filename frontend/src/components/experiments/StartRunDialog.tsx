'use client';

import { useState } from 'react';
import { Loader2, Play, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExperimentConfig } from './ExperimentConfigForm';
import { ConfigOverrideForm } from './ConfigOverrideForm';

interface StartRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experimentConfig: ExperimentConfig | null;
  isPreferenceDataset: boolean;
  onStart: (runName: string | undefined, configOverrides: ExperimentConfig | undefined) => Promise<void>;
}

/**
 * Dialog for starting a new training run with optional config overrides
 */
export function StartRunDialog({
  open,
  onOpenChange,
  experimentConfig,
  isPreferenceDataset,
  onStart,
}: StartRunDialogProps) {
  const [runName, setRunName] = useState('');
  const [showConfigOverrides, setShowConfigOverrides] = useState(false);
  const [configOverrides, setConfigOverrides] = useState<ExperimentConfig>({});
  const [starting, setStarting] = useState(false);

  const hasOverrides = Object.keys(configOverrides).length > 0;
  const hasExperimentConfig = experimentConfig && Object.keys(experimentConfig).length > 0;

  const handleStart = async () => {
    setStarting(true);
    try {
      // Only include overrides if any were set
      const overrides = Object.keys(configOverrides).length > 0 ? configOverrides : undefined;
      await onStart(runName.trim() || undefined, overrides);
      
      // Reset form
      setRunName('');
      setConfigOverrides({});
      setShowConfigOverrides(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to start run:', error);
    } finally {
      setStarting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setRunName('');
      setConfigOverrides({});
      setShowConfigOverrides(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play size={20} />
            Start Training Run
          </DialogTitle>
          <DialogDescription>
            Start a new training run for this experiment. You can optionally override specific parameters for this run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Run Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Run Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="Auto-generated if empty (e.g., run-1)"
            />
          </div>

          {/* Configuration Status */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasExperimentConfig ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="font-medium">Base Configuration:</span>
                <span className="text-muted-foreground">
                  {hasExperimentConfig ? 'Using experiment custom config' : 'Using system defaults'}
                </span>
              </div>
              {hasOverrides && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="font-medium">Active Overrides:</span>
                  <span className="text-orange-600 font-semibold">
                    {Object.keys(configOverrides).length} parameter(s) will be overridden
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Config Overrides */}
          <div className="space-y-3">
            <Button
              type="button"
              variant={hasOverrides ? "default" : "outline"}
              className="w-full justify-between"
              onClick={() => setShowConfigOverrides(!showConfigOverrides)}
            >
              <span className="flex items-center gap-2">
                <Settings size={16} />
                {hasOverrides 
                  ? `Override Parameters (${Object.keys(configOverrides).length} active)` 
                  : 'Override Parameters'}
              </span>
              {showConfigOverrides ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>

            {showConfigOverrides && (
              <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Customize Parameters for This Run</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      • <strong>Base values</strong> shown in gray are from your experiment config (or defaults)
                    </p>
                    <p>
                      • <strong>Modified fields</strong> are highlighted in orange and will override the base config
                    </p>
                    <p>
                      • Click &quot;Reset to base&quot; to remove an override
                    </p>
                  </div>
                </div>
                
                {hasOverrides && (
                  <div className="flex items-center justify-between p-2.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                      ⚠️ {Object.keys(configOverrides).length} parameter(s) will be overridden for this run
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfigOverrides({})}
                      className="h-7 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                    >
                      Clear all overrides
                    </Button>
                  </div>
                )}

                <ConfigOverrideForm
                  experimentConfig={experimentConfig}
                  overrides={configOverrides}
                  onChange={setConfigOverrides}
                  showDpo={isPreferenceDataset}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={starting}
          >
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={starting}>
            {starting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Play size={16} className="mr-2" />
            )}
            Start Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
