# Implementation Tasks

## Prerequisites
- [x] Confirm `training_config` is populated during adapter registration (verified in training.py)

## Backend Tasks

### 1. Update AdapterDetailRead Schema
- [x] Add `training_config: dict[str, Any] | None = None` to `AdapterDetailRead` in `schemas/adapter.py`

### 2. Update GET /adapters/{id} Endpoint
- [x] Include `training_config` field in response at `routers/adapters.py`

## Frontend Tasks

### 3. Add Tooltip UI Component
- [x] Create `components/ui/tooltip.tsx` using @radix-ui/react-tooltip
- [x] Install @radix-ui/react-tooltip dependency

### 4. Add TrainingConfig Type
- [x] Add `TrainingConfig` interface to `lib/api/types/adapters.ts`
- [x] Add `training_config` field to `AdapterDetail` interface

### 5. Create ConfigCard Component
- [x] Create `components/adapters/ConfigCard.tsx`
- [x] Props: title, icon, children
- [x] Consistent card styling matching workstation aesthetic

### 6. Create ConfigItem Component
- [x] Create `components/adapters/ConfigItem.tsx`
- [x] Props: label, value, tooltip, formatValue (optional)
- [x] Show "Not set" for undefined values
- [x] Monospace font for values
- [x] Info icon with tooltip on hover

### 7. Create HYPERPARAMETER_TOOLTIPS Constant
- [x] Create `lib/constants/hyperparameters.ts`
- [x] Define tooltip text for all training parameters
- [x] Group by category for maintainability

### 8. Create AdapterConfigTab Component
- [x] Create `components/adapters/AdapterConfigTab.tsx`
- [x] Implement 2x3 grid layout for config cards
- [x] Categories: Model, LoRA, Training, DPO, Hardware, Checkpointing
- [x] Show DPO section only for preference training

### 9. Add Tabs to Adapter Detail Page
- [x] Add Tabs component to `app/adapters/[id]/page.tsx`
- [x] Tab 1: Overview (existing content)
- [x] Tab 2: Configuration (new AdapterConfigTab)
- [x] Maintain URL state with query param (optional - deferred)

### 10. Export New Components
- [x] Update `components/adapters/index.ts` to export new components

## Testing
- [x] Test with adapter that has training_config
- [x] Test with adapter without training_config (graceful fallback)
- [x] Test tooltip hover interactions
- [x] Test responsive layout on different screen sizes

## Documentation
- [x] Update CHANGELOG.md
