'use client';

import { Info, Sparkles, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ExperimentConfig } from './ExperimentConfigForm';
import { HYPERPARAMETER_TOOLTIPS, LORA_TARGET_MODULES } from '@/lib/constants/hyperparameters';
import { DEFAULT_TRAINING_CONFIG, CONFIG_PRESETS, PresetKey } from '@/lib/constants/defaultConfig';

interface ConfigOverrideFormProps {
  experimentConfig: ExperimentConfig | null;
  overrides: ExperimentConfig;
  onChange: (overrides: ExperimentConfig) => void;
  showDpo?: boolean;
}

/**
 * Override form for run creation - shows base values and allows overrides
 * Displays experiment config values as reference with clear override indicators
 */
export function ConfigOverrideForm({
  experimentConfig,
  overrides,
  onChange,
  showDpo = false,
}: ConfigOverrideFormProps) {
  const getBaseValue = (field: keyof ExperimentConfig): string => {
    // Priority: experiment config > default config
    const expValue = experimentConfig?.[field];
    if (expValue !== undefined) {
      // Handle array values (like lora_target_modules)
      if (Array.isArray(expValue)) return expValue.join(', ');
      return String(expValue);
    }
    
    const defaultValue = DEFAULT_TRAINING_CONFIG[field as keyof typeof DEFAULT_TRAINING_CONFIG];
    if (defaultValue !== undefined) {
      // Handle array values
      if (Array.isArray(defaultValue)) return defaultValue.join(', ');
      return String(defaultValue);
    }
    return '';
  };

  const isOverridden = (field: keyof ExperimentConfig): boolean => {
    return overrides[field] !== undefined;
  };

  const updateField = (field: keyof ExperimentConfig, value: string | number | boolean | string[] | null) => {
    if (value === null) {
      // Clear override
      const newOverrides = { ...overrides };
      delete newOverrides[field];
      onChange(newOverrides);
    } else {
      onChange({ ...overrides, [field]: value });
    }
  };

  const applyPreset = (presetKey: PresetKey) => {
    const preset = CONFIG_PRESETS[presetKey];
    onChange({ ...overrides, ...preset.config });
  };

  const renderOverrideField = (
    field: keyof ExperimentConfig,
    label: string,
    type: 'number' | 'boolean',
    options?: { min?: number; max?: number; step?: number }
  ) => {
    const baseValue = getBaseValue(field);
    const overrideValue = overrides[field];
    const tooltip = HYPERPARAMETER_TOOLTIPS[field as keyof typeof HYPERPARAMETER_TOOLTIPS];
    const overridden = isOverridden(field);

    if (type === 'boolean') {
      return (
        <div key={field} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium">
                {label}
              </label>
              {tooltip && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} className="text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10} className="max-w-xs z-[100]">
                      <p className="text-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!overridden && (
                <span className="text-xs text-muted-foreground font-mono">
                  (base: {baseValue === 'true' ? '✓' : '✗'})
                </span>
              )}
              <Switch
                checked={overridden ? Boolean(overrideValue) : baseValue === 'true'}
                onCheckedChange={(checked) => {
                  if (String(checked) === baseValue) {
                    updateField(field, null); // Clear if matches base
                  } else {
                    updateField(field, checked);
                  }
                }}
              />
            </div>
          </div>
          {overridden && (
            <button
              type="button"
              onClick={() => updateField(field, null)}
              className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline"
            >
              Reset to base
            </button>
          )}
        </div>
      );
    }

    return (
      <div key={field} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label htmlFor={`override-${field}`} className="text-xs font-medium">
              {label}
            </label>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10} className="max-w-xs z-[100]">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!overridden && (
              <span className="text-xs text-muted-foreground font-mono">
                (base: {baseValue})
              </span>
            )}
            <Input
              id={`override-${field}`}
              type="number"
              value={overridden ? String(overrideValue) : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  updateField(field, null);
                } else {
                  const numVal = parseFloat(val);
                  if (String(numVal) === baseValue) {
                    updateField(field, null);
                  } else {
                    updateField(field, numVal);
                  }
                }
              }}
              placeholder={baseValue}
              min={options?.min}
              max={options?.max}
              step={options?.step}
              className={`w-28 h-7 text-xs font-mono text-right ${
                overridden ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''
              }`}
            />
          </div>
        </div>
        {overridden && (
          <button
            type="button"
            onClick={() => updateField(field, null)}
            className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline"
          >
            Reset to base ({baseValue})
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preset Buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles size={12} />
          <span>Quick Apply Training Strategy:</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(CONFIG_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(key as PresetKey)}
              className="text-xs h-auto py-2 flex flex-col items-start gap-0.5"
            >
              <span className="font-semibold">{preset.name}</span>
              <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                {preset.description}
              </span>
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Note: Applying a preset will override multiple parameters at once
        </p>
      </div>

      {/* Training Basics */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Training Parameters</h4>
        <div className="space-y-3">
          {renderOverrideField('num_epochs', 'Epochs', 'number', { min: 1, max: 100 })}
          {renderOverrideField('batch_size', 'Batch Size', 'number', { min: 1, max: 32 })}
          {renderOverrideField('learning_rate', 'Learning Rate', 'number', { step: 0.00001 })}
          {renderOverrideField('gradient_accumulation_steps', 'Gradient Accumulation', 'number', { min: 1, max: 64 })}
          {renderOverrideField('warmup_steps', 'Warmup Steps', 'number', { min: 0 })}
        </div>
      </div>

      {/* LoRA Parameters */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">LoRA Parameters</h4>
        <div className="space-y-3">
          {renderOverrideField('lora_r', 'Rank (r)', 'number', { min: 4, max: 128 })}
          {renderOverrideField('lora_alpha', 'Alpha', 'number', { min: 1, max: 256 })}
          {renderOverrideField('lora_dropout', 'Dropout', 'number', { step: 0.01, min: 0, max: 1 })}
          
          {/* Target Modules - checkbox grid with descriptions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium">Target Modules</label>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} className="text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10} className="max-w-xs z-[100]">
                      <p className="text-xs">{HYPERPARAMETER_TOOLTIPS.lora_target_modules}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isOverridden('lora_target_modules') && (
                <button
                  type="button"
                  onClick={() => updateField('lora_target_modules', null)}
                  className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline"
                >
                  Reset to base
                </button>
              )}
            </div>
            
            {/* Module selection grid */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              {/* Attention Layers */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Attention Layers (Recommended)</p>
                <div className="grid gap-2">
                  {Object.entries(LORA_TARGET_MODULES)
                    .filter(([, info]) => info.category === 'attention')
                    .map(([moduleKey, info]) => {
                      const baseModules = getBaseValue('lora_target_modules').split(', ').map(s => s.trim());
                      const currentModules = isOverridden('lora_target_modules')
                        ? (overrides.lora_target_modules as string[] || [])
                        : baseModules;
                      const isChecked = currentModules.includes(moduleKey);
                      const isBaseChecked = baseModules.includes(moduleKey);
                      const isModified = isOverridden('lora_target_modules') && isChecked !== isBaseChecked;
                      
                      return (
                        <label
                          key={moduleKey}
                          className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isModified ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-transparent'
                          } ${isChecked ? 'bg-muted/50' : ''}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              let newModules: string[];
                              if (checked) {
                                newModules = [...currentModules, moduleKey];
                              } else {
                                newModules = currentModules.filter(m => m !== moduleKey);
                              }
                              // Check if it matches base
                              const matchesBase = baseModules.length === newModules.length && 
                                baseModules.every(m => newModules.includes(m));
                              if (matchesBase) {
                                updateField('lora_target_modules', null);
                              } else {
                                updateField('lora_target_modules', newModules);
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium font-mono">{moduleKey}</span>
                              <span className="text-[10px] text-muted-foreground">({info.name})</span>
                              {info.recommended && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{info.description}</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">💡 {info.suggestion}</p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              
              {/* Feed-Forward Layers */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Feed-Forward Layers (Optional)</p>
                <div className="grid gap-2">
                  {Object.entries(LORA_TARGET_MODULES)
                    .filter(([, info]) => info.category === 'feedforward')
                    .map(([moduleKey, info]) => {
                      const baseModules = getBaseValue('lora_target_modules').split(', ').map(s => s.trim());
                      const currentModules = isOverridden('lora_target_modules')
                        ? (overrides.lora_target_modules as string[] || [])
                        : baseModules;
                      const isChecked = currentModules.includes(moduleKey);
                      const isBaseChecked = baseModules.includes(moduleKey);
                      const isModified = isOverridden('lora_target_modules') && isChecked !== isBaseChecked;
                      
                      return (
                        <label
                          key={moduleKey}
                          className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isModified ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-transparent'
                          } ${isChecked ? 'bg-muted/50' : ''}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              let newModules: string[];
                              if (checked) {
                                newModules = [...currentModules, moduleKey];
                              } else {
                                newModules = currentModules.filter(m => m !== moduleKey);
                              }
                              // Check if it matches base
                              const matchesBase = baseModules.length === newModules.length && 
                                baseModules.every(m => newModules.includes(m));
                              if (matchesBase) {
                                updateField('lora_target_modules', null);
                              } else {
                                updateField('lora_target_modules', newModules);
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium font-mono">{moduleKey}</span>
                              <span className="text-[10px] text-muted-foreground">({info.name})</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{info.description}</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">💡 {info.suggestion}</p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Hardware & Advanced</h4>
        <div className="space-y-3">
          {renderOverrideField('fp16', 'FP16 (Mixed Precision)', 'boolean')}
          {renderOverrideField('weight_decay', 'Weight Decay', 'number', { step: 0.001 })}
          {renderOverrideField('max_grad_norm', 'Max Grad Norm', 'number', { step: 0.1 })}
        </div>
      </div>

      {/* Early Stopping */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Early Stopping</h4>
        <div className="space-y-3">
          {renderOverrideField('early_stopping_enabled', 'Enable Early Stopping', 'boolean')}
          {renderOverrideField('early_stopping_patience', 'Patience', 'number', { min: 1 })}
          {renderOverrideField('early_stopping_threshold', 'Threshold', 'number', { step: 0.001, min: 0 })}
        </div>
      </div>

      {/* DPO Settings */}
      {showDpo && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">DPO Settings</h4>
          <div className="space-y-3">
            {renderOverrideField('dpo_beta', 'Beta', 'number', { step: 0.01, min: 0, max: 1 })}
          </div>
        </div>
      )}
    </div>
  );
}
