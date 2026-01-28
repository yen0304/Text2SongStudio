# Add Experiment Config Form

## Why
Users currently cannot set training hyperparameters when creating experiments. The `config` field exists in the backend but there's no UI to configure it. When users start a training run, it uses default values instead of user-specified settings. This makes it difficult to experiment with different training configurations.

## What Changes
- Add a collapsible "Training Configuration" section to the experiment create form
- Add an "Edit Config" feature in the experiment detail Config tab
- Reuse the existing `ConfigCard`/`ConfigItem` components for consistent UI
- Allow overriding config when creating a new run

## Summary
Add UI forms to configure training hyperparameters at experiment creation and run creation time, enabling users to customize learning rate, LoRA parameters, batch size, epochs, and other settings.

## Problem Statement
Currently:
1. The experiment creation form only accepts name, description, and dataset
2. The `Experiment.config` and `ExperimentRun.config` fields exist but are never populated
3. The Config tab on experiment detail shows "No configuration available"
4. Training runs use default `TrainingConfig` values from `model/training/config.py`

## Proposed Solution
1. **Experiment Create Form**: Add collapsible config section with hyperparameter inputs
2. **Experiment Config Tab**: Replace raw JSON display with editable config form
3. **Run Create Dialog**: Add optional config overrides when starting a run
4. **Shared Components**: Extend existing `ConfigCard`/`ConfigItem` for input mode

## Scope
- **In Scope**:
  - Config form for experiment creation (grouped by category)
  - Config editing in experiment detail page
  - Config override form for run creation
  - Preset/template buttons for common configurations
  - Tooltips reused from `HYPERPARAMETER_TOOLTIPS`
- **Out of Scope**:
  - Config comparison between experiments
  - Import/export configuration files
  - Configuration validation against model constraints

## Impact Analysis
- **Backend**: No changes needed (API already accepts config)
- **Frontend**: New form components, update create/edit flows
- **Database**: No changes (schema already supports config)
- **Breaking Changes**: None

## Success Criteria
- [x] Users can set training config when creating experiments
- [x] Users can edit config on existing experiments
- [x] Users can override config when starting a run
- [x] Tooltips explain each parameter
- [x] Config is saved and displayed correctly after creation
