# Design: Adapter Training Configuration View

## UI Architecture

### Layout Decision: Tabs within Detail Page
Rather than a separate page, use tabs within the adapter detail page:
- **Overview** tab (current content: cards, versions list, timeline)
- **Configuration** tab (new: training parameters)

This keeps context intact and follows established patterns (GitLab, AWS).

### Configuration Tab Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Configuration                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │ 📦 Model            │  │ 🔗 LoRA             │                   │
│  ├─────────────────────┤  ├─────────────────────┤                   │
│  │ Base Model          │  │ Rank (r)         16 │                   │
│  │ musicgen-small   ⓘ │  │ Alpha            32 │                   │
│  │                     │  │ Dropout        0.05 │                   │
│  │ Dataset Type        │  │ Target Modules      │                   │
│  │ supervised       ⓘ │  │ q_proj, v_proj   ⓘ │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │ 🎯 Training         │  │ ⚙️ Hardware         │                   │
│  ├─────────────────────┤  ├─────────────────────┤                   │
│  │ Epochs            3 │  │ FP16          true  │                   │
│  │ Batch Size        2 │  │ Device        cuda  │                   │
│  │ Learning Rate 1e-4  │  │                     │                   │
│  │ Warmup Steps    100 │  │                     │                   │
│  │ Weight Decay   0.01 │  │                     │                   │
│  │ Max Grad Norm  1.0  │  │                     │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │ 🎲 DPO (if pref)    │  │ 💾 Checkpointing    │                   │
│  ├─────────────────────┤  ├─────────────────────┤                   │
│  │ Beta           0.1  │  │ Save Steps     500  │                   │
│  │                     │  │ Save Limit       3  │                   │
│  │                     │  │ Eval Steps     100  │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Structure

### New Components
1. **ConfigCard** - Reusable card for parameter group
2. **ConfigItem** - Single parameter with label, value, and tooltip
3. **Tooltip** - shadcn/ui tooltip component (needs to be added)
4. **AdapterConfigTab** - Main configuration tab component

### Tooltip Content (Hyperparameter Explanations)

| Parameter | Tooltip |
|-----------|---------|
| base_model | The foundation model used for fine-tuning. MusicGen variants include small (300M), medium (1.5B), and large (3.3B). |
| dataset_type | Training approach: 'supervised' uses rated samples for SFT, 'preference' uses comparison pairs for DPO. |
| lora_r | LoRA rank - lower values (4-16) are more efficient, higher values (32-64) capture more complex adaptations. |
| lora_alpha | LoRA scaling factor. Common practice: alpha = 2 × rank. Higher values increase adaptation strength. |
| lora_dropout | Dropout rate for LoRA layers. Helps prevent overfitting. Typical values: 0.0-0.1. |
| target_modules | Model layers to apply LoRA to. Usually attention layers (q_proj, v_proj, k_proj, out_proj). |
| num_epochs | Number of complete passes through the training dataset. More epochs can improve results but risk overfitting. |
| batch_size | Samples processed per training step. Larger batches are more stable but require more memory. |
| learning_rate | Step size for parameter updates. Too high causes instability, too low causes slow convergence. Typical: 1e-4 to 1e-5. |
| gradient_accumulation_steps | Accumulate gradients over N steps before update. Simulates larger batch size with less memory. |
| warmup_steps | Steps to gradually increase learning rate at start. Helps stabilize early training. |
| weight_decay | L2 regularization strength. Helps prevent overfitting by penalizing large weights. |
| max_grad_norm | Clip gradients to prevent exploding gradients. Values 0.5-1.0 are common. |
| dpo_beta | DPO temperature parameter. Lower values (0.1-0.5) make preferences sharper. |
| fp16 | Use 16-bit floating point for faster training and lower memory usage. |
| save_steps | Save checkpoint every N training steps. |
| save_total_limit | Maximum checkpoints to keep. Older ones are deleted. |
| eval_steps | Run evaluation every N steps. |
| early_stopping_patience | Stop if no improvement for N evaluations. |
| final_loss | The final training loss value when training completed. |

## API Changes

### Backend: AdapterDetailRead Schema
Add `training_config` field:
```python
class AdapterDetailRead(AdapterRead):
    versions: list[AdapterVersionRead] = []
    training_config: dict[str, Any] | None = None  # NEW
```

### Backend: GET /adapters/{id} Response
Include `training_config` in response.

### Frontend: AdapterDetail Type
```typescript
export interface AdapterDetail extends Adapter {
  versions: AdapterVersion[];
  training_config: TrainingConfig | null;  // NEW
}

export interface TrainingConfig {
  base_model?: string;
  dataset_type?: string;
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  lora_target_modules?: string[];
  num_epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  gradient_accumulation_steps?: number;
  warmup_steps?: number;
  weight_decay?: number;
  max_grad_norm?: number;
  dpo_beta?: number;
  fp16?: boolean;
  device?: string;
  save_steps?: number;
  save_total_limit?: number;
  eval_steps?: number;
  early_stopping_patience?: number;
  early_stopping_threshold?: number;
  final_loss?: number;
}
```

## Design Principles

1. **Information Hierarchy** - Most important params (Model, LoRA) at top
2. **Contextual Help** - Every parameter has tooltip, no external docs needed
3. **Visual Grouping** - Related params in same card, clear categories
4. **Graceful Degradation** - Show "Not set" for missing values
5. **Professional Aesthetic** - Monospace values, consistent spacing, subtle colors
