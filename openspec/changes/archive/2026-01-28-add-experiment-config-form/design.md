# Design: Experiment Config Form

## Component Architecture

### Reusable Components
The adapter config view already created these components that we'll extend:
- `ConfigCard` - Card container for grouped parameters
- `ConfigItem` - Individual parameter with label, value, tooltip
- `HYPERPARAMETER_TOOLTIPS` - Explanations for all parameters

### New Components

#### `ConfigFormCard`
A form variant of `ConfigCard` that contains input fields instead of display values.

```
Props:
- title: string
- icon: React.ReactNode
- children: React.ReactNode
- collapsible?: boolean (default true)
- defaultOpen?: boolean
```

#### `ConfigFormItem`
A form input variant of `ConfigItem` with tooltip.

```
Props:
- label: string
- name: string (form field name)
- value: string | number | boolean
- onChange: (value) => void
- tooltip: string
- type: 'number' | 'text' | 'boolean' | 'select'
- options?: { value: string, label: string }[] (for select)
- placeholder?: string
- min?: number
- max?: number
- step?: number
```

#### `ExperimentConfigForm`
Main form component used in both create and edit contexts.

```
Props:
- config: Partial<TrainingConfig>
- onChange: (config: Partial<TrainingConfig>) => void
- compact?: boolean (for create form, show fewer fields)
```

### Form Layout

#### Compact Mode (Experiment Creation)
Shows essential parameters only:
- **Training Basics**: epochs, learning_rate, batch_size
- **LoRA Settings**: lora_r, lora_alpha
- **Show More** button to expand all settings

#### Full Mode (Config Tab / Edit)
Shows all parameters in 6 cards (same as adapter config view):
1. Model Settings
2. LoRA Parameters  
3. Training Hyperparameters
4. DPO Settings (conditional)
5. Hardware Settings
6. Checkpointing & Outputs

### State Management

Experiment create form will manage config as part of form state:
```typescript
const [config, setConfig] = useState<Partial<TrainingConfig>>({
  // Start with sensible defaults
  num_epochs: 3,
  learning_rate: 1e-4,
  batch_size: 2,
  lora_r: 16,
  lora_alpha: 32,
});
```

### API Integration

No backend changes needed. Frontend will:
1. Collect config from form
2. Pass to `experimentsApi.create({ name, description, dataset_id, config })`
3. Backend already stores and returns config

## UI Flow

### Create Experiment
1. User clicks "New Experiment"
2. Form shows name, description, dataset selector
3. Below: collapsible "Training Configuration" section (collapsed by default)
4. User can expand and customize parameters
5. On submit, config is included in API call

### Edit Experiment Config
1. User views experiment detail page
2. Clicks "Config" tab
3. Instead of JSON, sees editable form (same layout as adapter config view)
4. "Save Changes" button appears when config is modified
5. On save, calls `experimentsApi.update(id, { config })`

### Create Run with Override
1. User clicks "Start Run" on experiment
2. Dialog shows run name input
3. Collapsible "Override Configuration" section
4. Shows current experiment config as defaults
5. User can modify specific values
6. On start, run config includes overrides only

## Default Values

Match `TrainingConfig` defaults from `model/training/config.py`:
- `num_epochs`: 3
- `batch_size`: 2
- `learning_rate`: 1e-4
- `lora_r`: 16
- `lora_alpha`: 32
- `lora_dropout`: 0.05
- `gradient_accumulation_steps`: 4
- `warmup_steps`: 100
- `fp16`: true
