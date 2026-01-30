# Change: Add Model Configuration System

## Why

Currently the system has several disconnected model-related configurations:
1. **Settings page** has a static model selector (MusicGen Small/Medium/Large) that doesn't actually connect to the backend
2. **Generation duration** can be set freely, but different models have different max duration limits (causing CUDA errors when exceeded)
3. **Adapters** are tied to a base model, but there's no validation that the selected adapter is compatible with the current generation settings
4. **No centralized model registry** - model capabilities (max duration, memory requirements) are not documented or enforced

This leads to runtime errors (CUDA out of memory, assertion failures) when users select incompatible configurations.

## What Changes

### Backend
- **Add Model Registry**: A centralized configuration defining supported models and their capabilities
  - Max generation duration (tokens)
  - Memory requirements
  - Sample rate
  - Other model-specific parameters
- **New API endpoint**: `GET /models` to retrieve available models with their capabilities
- **Update Generation API**: Validate duration against model limits before starting generation
- **Update Adapter API**: Include `base_model` in adapter list response for UI filtering

### Frontend  
- **Update Settings Page**: Connect model selector to backend, show model capabilities
  - **Dynamic model switching**: Users can switch models directly from the UI
  - Backend will unload current model and load the new one on-demand
  - **Progress modal**: Show real-time download/loading progress during model switch
    - Stream progress events via SSE (Server-Sent Events)
    - Display progress bar and status messages
    - Warning to prevent users from closing the page
    - Block other operations during switch
- **Update PromptEditor**: 
  - Dynamic duration limits based on current model
  - **Filter adapter list** to show only adapters compatible with currently loaded model
  - Show incompatible adapters as disabled with hint (e.g., "Requires MusicGen Large")
- **Add model capability display**: Show max duration, memory info when selecting model/adapter

### Validation
- Generation requests validate duration against model limits before starting generation
- **Adapter compatibility check**: Reject generation if adapter's base model doesn't match loaded model
- Warn users when approaching limits
- Graceful error handling with clear messages

### Design Decision: Adapter Compatibility (방案 B)

LoRA adapters are **bound to a specific base model** - an adapter trained on `musicgen-small` cannot be used with `musicgen-medium`. 

We chose **"Filter + Hint"** approach:
1. Generate page filters adapter list to show only compatible adapters
2. Incompatible adapters shown as disabled with message: "Requires [Model Name]"
3. Users can switch model in Settings to access other adapters

## Impact

- **Affected specs**: 
  - `audio-generation` (duration validation)
  - `lora-adapter-management` (model compatibility display)
- **Affected code**:
  - `backend/app/config.py` (model registry)
  - `backend/app/routers/generation.py` (validation)
  - `backend/app/schemas/` (new model schema)
  - `frontend/src/app/settings/page.tsx`
  - `frontend/src/components/PromptEditor.tsx`
  - `frontend/src/lib/api/` (new model API)

## Non-Goals (Out of Scope)

- Multi-GPU support
