# Add Adapter Training Configuration View

## Why
ML engineers need to review and understand training hyperparameters used for each adapter. The current raw JSON display is hard to read and lacks explanations for what each parameter does.

## What Changes
- Backend returns `training_config` in adapter detail API
- Frontend adds tabbed interface (Overview/Configuration) to adapter detail page
- New configuration tab displays hyperparameters grouped by category with tooltips

## Summary
Add a dedicated training configuration view for adapters, displaying hyperparameters with explanatory tooltips in a professional workstation-style UI similar to AWS/GitLab pipelines.

## Problem Statement
Currently, the adapter detail page has a "Configuration" section that displays `adapter.config` as raw JSON. However:
1. The actual training configuration is stored in `training_config`, not `config`
2. Raw JSON is not user-friendly for engineers reviewing training parameters
3. There's no explanation of what each hyperparameter does
4. The current single-card layout doesn't scale well for detailed configuration data

## Proposed Solution
Create a professional training configuration view with:
1. **New Configuration Tab/Section** - Separate tab within adapter detail page for configuration
2. **Structured Parameter Display** - Group parameters by category (Model, LoRA, Training, Hardware)
3. **Tooltip Explanations** - Hover tooltips explaining each hyperparameter's purpose and typical values
4. **Workstation-style UI** - Clean, professional layout similar to AWS/GitLab pipeline dashboards

## Scope
- **In Scope**:
  - Backend: Add `training_config` to `AdapterDetailRead` schema
  - Frontend: New configuration tab/section in adapter detail page
  - Frontend: Parameter grouping by category (Model, LoRA, Training, DPO, Hardware)
  - Frontend: Tooltip component with hyperparameter explanations
  - Frontend: Professional workstation-style card layout
- **Out of Scope**:
  - Editing training configuration (read-only view)
  - Configuration comparison between adapters
  - Configuration templates or presets

## Impact Analysis
- **Backend**: Minor schema change to include `training_config` in detail response
- **Frontend**: New components and tab layout in adapter detail page
- **Database**: No changes (data already exists)
- **Breaking Changes**: None

## Success Criteria
- [ ] Adapter detail page displays training configuration in organized sections
- [ ] Each hyperparameter has a hover tooltip with explanation
- [ ] Configuration is grouped by category (Model, LoRA, Training, DPO, Hardware)
- [ ] UI follows workstation-style design patterns (clean, professional, not cluttered)
