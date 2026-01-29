'use client';

import { Package, Link2, Target, Dices, Cpu, Save, TrendingDown } from 'lucide-react';
import { ConfigCard } from './ConfigCard';
import { ConfigItem } from './ConfigItem';
import { TrainingConfig } from '@/lib/api/types/adapters';
import { HYPERPARAMETER_TOOLTIPS } from '@/lib/constants/hyperparameters';

interface AdapterConfigTabProps {
  trainingConfig: TrainingConfig | null;
}

/**
 * Configuration tab content showing training parameters in organized cards
 * Displays hyperparameters grouped by category with tooltips
 */
export function AdapterConfigTab({ trainingConfig }: AdapterConfigTabProps) {
  if (!trainingConfig || Object.keys(trainingConfig).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Training Configuration</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This adapter was not trained within the system, or training configuration data is not available.
        </p>
      </div>
    );
  }

  const isDPO = trainingConfig.dataset_type === 'preference';

  return (
    <div className="space-y-6">
      {/* Top row: Model, LoRA, Training */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model Card */}
        <ConfigCard title="Model" icon={<Package size={18} />}>
          <ConfigItem
            label="Base Model"
            value={trainingConfig.base_model}
            tooltip={HYPERPARAMETER_TOOLTIPS.base_model}
          />
          <ConfigItem
            label="Dataset Type"
            value={trainingConfig.dataset_type}
            tooltip={HYPERPARAMETER_TOOLTIPS.dataset_type}
          />
        </ConfigCard>

        {/* LoRA Card */}
        <ConfigCard title="LoRA" icon={<Link2 size={18} />}>
          <ConfigItem
            label="Rank (r)"
            value={trainingConfig.lora_r}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_r}
          />
          <ConfigItem
            label="Alpha"
            value={trainingConfig.lora_alpha}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_alpha}
          />
          <ConfigItem
            label="Dropout"
            value={trainingConfig.lora_dropout}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_dropout}
          />
          <ConfigItem
            label="Target Modules"
            value={trainingConfig.lora_target_modules}
            tooltip={HYPERPARAMETER_TOOLTIPS.lora_target_modules}
          />
        </ConfigCard>

        {/* Training Card */}
        <ConfigCard title="Training" icon={<Target size={18} />}>
          <ConfigItem
            label="Epochs"
            value={trainingConfig.num_epochs}
            tooltip={HYPERPARAMETER_TOOLTIPS.num_epochs}
          />
          <ConfigItem
            label="Batch Size"
            value={trainingConfig.batch_size}
            tooltip={HYPERPARAMETER_TOOLTIPS.batch_size}
          />
          <ConfigItem
            label="Learning Rate"
            value={trainingConfig.learning_rate}
            tooltip={HYPERPARAMETER_TOOLTIPS.learning_rate}
          />
          <ConfigItem
            label="Gradient Accumulation"
            value={trainingConfig.gradient_accumulation_steps}
            tooltip={HYPERPARAMETER_TOOLTIPS.gradient_accumulation_steps}
          />
          <ConfigItem
            label="Warmup Steps"
            value={trainingConfig.warmup_steps}
            tooltip={HYPERPARAMETER_TOOLTIPS.warmup_steps}
          />
          <ConfigItem
            label="Weight Decay"
            value={trainingConfig.weight_decay}
            tooltip={HYPERPARAMETER_TOOLTIPS.weight_decay}
          />
          <ConfigItem
            label="Max Grad Norm"
            value={trainingConfig.max_grad_norm}
            tooltip={HYPERPARAMETER_TOOLTIPS.max_grad_norm}
          />
        </ConfigCard>
      </div>

      {/* Bottom row: DPO (conditional), Hardware, Checkpointing, Results */}
      <div className={`grid grid-cols-1 ${isDPO ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
        {/* DPO Card - Only show for preference training */}
        {isDPO && (
          <ConfigCard title="DPO" icon={<Dices size={18} />}>
            <ConfigItem
              label="Beta"
              value={trainingConfig.dpo_beta}
              tooltip={HYPERPARAMETER_TOOLTIPS.dpo_beta}
            />
          </ConfigCard>
        )}

        {/* Hardware Card */}
        <ConfigCard title="Hardware" icon={<Cpu size={18} />}>
          <ConfigItem
            label="FP16"
            value={trainingConfig.fp16}
            tooltip={HYPERPARAMETER_TOOLTIPS.fp16}
          />
          <ConfigItem
            label="Device"
            value={trainingConfig.device}
            tooltip={HYPERPARAMETER_TOOLTIPS.device}
          />
        </ConfigCard>

        {/* Checkpointing Card */}
        <ConfigCard title="Checkpointing" icon={<Save size={18} />}>
          <ConfigItem
            label="Save Steps"
            value={trainingConfig.save_steps}
            tooltip={HYPERPARAMETER_TOOLTIPS.save_steps}
          />
          <ConfigItem
            label="Save Limit"
            value={trainingConfig.save_total_limit}
            tooltip={HYPERPARAMETER_TOOLTIPS.save_total_limit}
          />
          <ConfigItem
            label="Eval Steps"
            value={trainingConfig.eval_steps}
            tooltip={HYPERPARAMETER_TOOLTIPS.eval_steps}
          />
          <ConfigItem
            label="Early Stopping"
            value={trainingConfig.early_stopping_enabled === false ? 'Disabled' : 'Enabled'}
            tooltip={HYPERPARAMETER_TOOLTIPS.early_stopping_enabled}
          />
          <ConfigItem
            label="Early Stop Patience"
            value={trainingConfig.early_stopping_patience}
            tooltip={HYPERPARAMETER_TOOLTIPS.early_stopping_patience}
          />
        </ConfigCard>

        {/* Results Card */}
        <ConfigCard title="Results" icon={<TrendingDown size={18} />}>
          <ConfigItem
            label="Final Loss"
            value={trainingConfig.final_loss}
            tooltip={HYPERPARAMETER_TOOLTIPS.final_loss}
            formatValue={(v) => typeof v === 'number' ? v.toFixed(4) : String(v)}
          />
        </ConfigCard>
      </div>
    </div>
  );
}
