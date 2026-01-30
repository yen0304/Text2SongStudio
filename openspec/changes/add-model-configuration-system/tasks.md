## 1. Backend - Model Registry

- [x] 1.1 Create `backend/app/models/model_registry.py` with `ModelConfig` dataclass
- [x] 1.2 Define configurations for musicgen-small, musicgen-medium, musicgen-large
- [x] 1.3 Add helper functions: `get_model_config()`, `get_max_duration()`, `list_models()`

## 2. Backend - Models API

- [x] 2.1 Create `backend/app/schemas/model.py` with `ModelConfigResponse`, `ModelsListResponse`
- [x] 2.2 Create `backend/app/routers/models.py` with `GET /models` endpoint
- [x] 2.3 Register router in `main.py`
- [x] 2.4 Add current active model info to response

## 3. Backend - Generation Validation

- [x] 3.1 Update `GenerationService.generate_audio()` to validate duration against model limits
- [x] 3.2 Add adapter compatibility check: reject if adapter's base model != current model
- [x] 3.3 Return clear error messages for both duration and compatibility errors
- [x] 3.4 Update generation schema to document duration limits

## 4. Backend - Adapter Model Info

- [x] 4.1 Update `AdapterRead` schema to include `base_model_config` field
- [x] 4.2 Update adapter list endpoint to populate model config from registry
- [x] 4.3 Ensure adapter detail also includes model capabilities

## 5. Frontend - API Client

- [x] 5.1 Add `ModelConfig` type to `frontend/src/lib/api/types/`
- [x] 5.2 Create `modelsApi` module with `list()` function
- [x] 5.3 Update `Adapter` type to include optional `base_model_config`

## 6. Frontend - PromptEditor Duration & Adapter Filtering

- [x] 6.1 Fetch current model config on component mount
- [x] 6.2 Filter adapter list: show compatible adapters as selectable, incompatible as disabled
- [x] 6.3 Show hint on disabled adapters: "Requires [Model Name]"
- [x] 6.4 Add message below adapter selector explaining incompatible adapters
- [x] 6.5 Update duration slider max based on current model (not adapter)
- [x] 6.6 Show model capability hint below duration input
- [x] 6.7 Show warning when approaching max duration

## 7. Frontend - Settings Page

- [x] 7.1 Fetch available models from `/models` endpoint
- [x] 7.2 Populate model selector with actual available models
- [x] 7.3 Display model capabilities (VRAM, max duration) when selected
- [x] 7.4 Show current active model indicator
- [x] 7.5 Add dynamic model switching (call backend API to switch model)

## 8. Backend - Dynamic Model Switching

- [x] 8.1 Add `POST /models/switch` endpoint to switch active model
- [x] 8.2 Update `GenerationService` to support model unloading and reloading
- [x] 8.3 Handle concurrent requests during model switch (queue or reject)

## 9. Testing

- [x] 9.1 Add backend tests for model registry functions
- [x] 9.2 Add backend tests for generation duration validation
- [x] 9.3 Add frontend tests for duration limit behavior

## 10. Model Switch Progress Streaming

- [x] 10.1 Add `POST /models/switch/stream` endpoint with SSE progress events
- [x] 10.2 Update `GenerationService.switch_model` to support progress callback
- [x] 10.3 Add `switchModelStream` function to frontend `modelsApi`
- [x] 10.4 Create `ModelSwitchingModal` component with progress display
- [x] 10.5 Update Settings page to use modal for model switching
- [x] 10.6 Add warning message about not closing the page during switch