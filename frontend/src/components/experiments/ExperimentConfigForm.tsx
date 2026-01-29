'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Layers, Settings, Zap, HardDrive, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigCard } from '@/components/adapters/ConfigCard';
import { ConfigFormItem } from '@/components/adapters/ConfigFormItem';
import { HYPERPARAMETER_TOOLTIPS } from '@/lib/constants/hyperparameters';
import { DEFAULT_TRAINING_CONFIG, ESSENTIAL_CONFIG_FIELDS, CONFIG_PRESETS, PresetKey } from '@/lib/constants/defaultConfig';

export interface ExperimentConfig {
  // Training basics
  num_epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  gradient_accumulation_steps?: number;
  warmup_steps?: number;
  weight_decay?: number;
  max_grad_norm?: number;
  // LoRA
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  lora_target_modules?: string[];
  // DPO
  dpo_beta?: number;
  // Hardware
  fp16?: boolean;
  // Checkpointing
  save_steps?: number;
  save_total_limit?: number;
  eval_steps?: number;
  // Early stopping
  early_stopping_enabled?: boolean;
  early_stopping_patience?: number;
  early_stopping_threshold?: number;
}

interface ExperimentConfigFormProps {
  config: ExperimentConfig;
  onChange: (config: ExperimentConfig) => void;
  compact?: boolean;
  disabled?: boolean;
  showDpo?: boolean;
}

/**
 * Form for configuring training hyperparameters
 * Supports compact mode (essential fields) and full mode (all fields)
 */
export function ExperimentConfigForm({
  config,
  onChange,
  compact = false,
  disabled = false,
  showDpo = false,
}: ExperimentConfigFormProps) {
  const [expanded, setExpanded] = useState(false);

  const updateField = (field: keyof ExperimentConfig, value: string | number | boolean) => {
    onChange({ ...config, [field]: value });
  };

  const getFieldValue = (field: keyof ExperimentConfig): string | number | boolean | undefined => {
    const value = config[field];
    if (value !== undefined) return value;
    return DEFAULT_TRAINING_CONFIG[field as keyof typeof DEFAULT_TRAINING_CONFIG];
  };

  const applyPreset = (presetKey: PresetKey) => {
    const preset = CONFIG_PRESETS[presetKey];
    onChange({ ...config, ...preset.config });
  };

  // Compact mode: show essential fields only
  if (compact && !expanded) {
    return (
      <div className="space-y-4">
        {/* Preset Buttons */}
        {!disabled && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles size={14} />
              <span>Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CONFIG_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(key as PresetKey)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Conservative: Stable · Balanced: Recommended · Aggressive: Fast
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Training Basics */}
          <div className="space-y-1">
            <ConfigFormItem
              label="Epochs"
              name="num_epochs"
              value={getFieldValue('num_epochs')}
              onChange={(v) => updateField('num_epochs', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.num_epochs}
              type="number"
              min={1}
              max={100}
              placeholder={String(DEFAULT_TRAINING_CONFIG.num_epochs)}
              disabled={disabled}
            />
            <ConfigFormItem
              label="Batch Size"
              name="batch_size"
              value={getFieldValue('batch_size')}
              onChange={(v) => updateField('batch_size', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.batch_size}
              type="number"
              min={1}
              max={32}
              placeholder={String(DEFAULT_TRAINING_CONFIG.batch_size)}
              disabled={disabled}
            />
            <ConfigFormItem
              label="Learning Rate"
              name="learning_rate"
              value={getFieldValue('learning_rate')}
              onChange={(v) => updateField('learning_rate', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.learning_rate}
              type="number"
              step={0.00001}
              placeholder={String(DEFAULT_TRAINING_CONFIG.learning_rate)}
              disabled={disabled}
            />
          </div>
          {/* LoRA */}
          <div className="space-y-1">
            <ConfigFormItem
              label="LoRA Rank"
              name="lora_r"
              value={getFieldValue('lora_r')}
              onChange={(v) => updateField('lora_r', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.lora_r}
              type="number"
              min={4}
              max={128}
              placeholder={String(DEFAULT_TRAINING_CONFIG.lora_r)}
              disabled={disabled}
            />
            <ConfigFormItem
              label="LoRA Alpha"
              name="lora_alpha"
              value={getFieldValue('lora_alpha')}
              onChange={(v) => updateField('lora_alpha', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.lora_alpha}
              type="number"
              min={1}
              max={256}
              placeholder={String(DEFAULT_TRAINING_CONFIG.lora_alpha)}
              disabled={disabled}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="text-muted-foreground"
        >
          <ChevronDown size={16} className="mr-1" />
          Show advanced settings
        </Button>
      </div>
    );
  }

  // Full mode: show all fields in cards
  return (
    <div className="space-y-4">
      {compact && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="text-muted-foreground"
        >
          <ChevronUp size={16} className="mr-1" />
          Hide advanced settings
        </Button>
      )}

      {/* Preset Buttons in full mode */}
      {!disabled && (
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles size={14} />
            <span>Apply Training Preset</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(CONFIG_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key as PresetKey)}
                className="text-left p-3 border rounded-lg hover:bg-accent hover:border-accent-foreground transition-colors"
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Training Hyperparameters */}
        <ConfigCard title="Training" icon={<Settings size={18} />}>
          <ConfigFormItem
            label="Epochs"
            name="num_epochs"
            value={getFieldValue('num_epochs')}
            onChange={(v) => updateField('num_epochs', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.num_epochs}
            type="number"
            min={1}
            max={100}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Batch Size"
            name="batch_size"
            value={getFieldValue('batch_size')}
            onChange={(v) => updateField('batch_size', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.batch_size}
            type="number"
            min={1}
            max={32}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Learning Rate"
            name="learning_rate"
            value={getFieldValue('learning_rate')}
            onChange={(v) => updateField('learning_rate', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.learning_rate}
            type="number"
            step={0.00001}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Gradient Accumulation"
            name="gradient_accumulation_steps"
            value={getFieldValue('gradient_accumulation_steps')}
            onChange={(v) => updateField('gradient_accumulation_steps', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.gradient_accumulation_steps}
            type="number"
            min={1}
            max={64}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Warmup Steps"
            name="warmup_steps"
            value={getFieldValue('warmup_steps')}
            onChange={(v) => updateField('warmup_steps', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.warmup_steps}
            type="number"
            min={0}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Weight Decay"
            name="weight_decay"
            value={getFieldValue('weight_decay')}
            onChange={(v) => updateField('weight_decay', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.weight_decay}
            type="number"
            step={0.001}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Max Grad Norm"
            name="max_grad_norm"
            value={getFieldValue('max_grad_norm')}
            onChange={(v) => updateField('max_grad_norm', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.max_grad_norm}
            type="number"
            step={0.1}
            disabled={disabled}
          />
        </ConfigCard>

        {/* LoRA Parameters */}
        <ConfigCard title="LoRA Parameters" icon={<Layers size={18} />}>
          <ConfigFormItem
            label="Rank (r)"
            name="lora_r"
            value={getFieldValue('lora_r')}
            onChange={(v) => updateField('lora_r', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_r}
            type="number"
            min={4}
            max={128}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Alpha"
            name="lora_alpha"
            value={getFieldValue('lora_alpha')}
            onChange={(v) => updateField('lora_alpha', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_alpha}
            type="number"
            min={1}
            max={256}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Dropout"
            name="lora_dropout"
            value={getFieldValue('lora_dropout')}
            onChange={(v) => updateField('lora_dropout', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_dropout}
            type="number"
            step={0.01}
            min={0}
            max={1}
            disabled={disabled}
          />
        </ConfigCard>

        {/* Hardware Settings */}
        <ConfigCard title="Hardware" icon={<Cpu size={18} />}>
          <ConfigFormItem
            label="FP16 (Mixed Precision)"
            name="fp16"
            value={getFieldValue('fp16')}
            onChange={(v) => updateField('fp16', v as boolean)}
            tooltip={HYPERPARAMETER_TOOLTIPS.fp16}
            type="boolean"
            disabled={disabled}
          />
        </ConfigCard>

        {/* DPO Settings - only show for preference training */}
        {showDpo && (
          <ConfigCard title="DPO Settings" icon={<Zap size={18} />}>
            <ConfigFormItem
              label="Beta"
              name="dpo_beta"
              value={getFieldValue('dpo_beta')}
              onChange={(v) => updateField('dpo_beta', v as number)}
              tooltip={HYPERPARAMETER_TOOLTIPS.dpo_beta}
              type="number"
              step={0.01}
              min={0}
              max={1}
              disabled={disabled}
            />
          </ConfigCard>
        )}

        {/* Checkpointing */}
        <ConfigCard title="Checkpointing" icon={<Save size={18} />}>
          <ConfigFormItem
            label="Save Steps"
            name="save_steps"
            value={getFieldValue('save_steps')}
            onChange={(v) => updateField('save_steps', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.save_steps}
            type="number"
            min={1}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Save Limit"
            name="save_total_limit"
            value={getFieldValue('save_total_limit')}
            onChange={(v) => updateField('save_total_limit', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.save_total_limit}
            type="number"
            min={1}
            disabled={disabled}
          />
          <ConfigFormItem
            label="Eval Steps"
            name="eval_steps"
            value={getFieldValue('eval_steps')}
            onChange={(v) => updateField('eval_steps', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.eval_steps}
            type="number"
            min={1}
            disabled={disabled}
          />
        </ConfigCard>

        {/* Early Stopping */}
        <ConfigCard title="Early Stopping" icon={<HardDrive size={18} />}>
          <ConfigFormItem
            label="Enable Early Stopping"
            name="early_stopping_enabled"
            value={getFieldValue('early_stopping_enabled')}
            onChange={(v) => updateField('early_stopping_enabled', v as boolean)}
            tooltip={HYPERPARAMETER_TOOLTIPS.early_stopping_enabled}
            type="boolean"
            disabled={disabled}
          />
          <ConfigFormItem
            label="Patience"
            name="early_stopping_patience"
            value={getFieldValue('early_stopping_patience')}
            onChange={(v) => updateField('early_stopping_patience', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.early_stopping_patience}
            type="number"
            min={1}
            disabled={disabled || getFieldValue('early_stopping_enabled') === false}
          />
          <ConfigFormItem
            label="Threshold"
            name="early_stopping_threshold"
            value={getFieldValue('early_stopping_threshold')}
            onChange={(v) => updateField('early_stopping_threshold', v as number)}
            tooltip={HYPERPARAMETER_TOOLTIPS.early_stopping_threshold}
            type="number"
            step={0.001}
            min={0}
            disabled={disabled || getFieldValue('early_stopping_enabled') === false}
          />
        </ConfigCard>
      </div>
    </div>
  );
}
