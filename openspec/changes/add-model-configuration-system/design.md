# Design: Model Configuration System

## Overview

This design introduces a centralized Model Registry that provides model capabilities to both backend validation and frontend UI, ensuring consistent behavior and preventing runtime errors from incompatible configurations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  Settings Page          │  PromptEditor                          │
│  - Model selector       │  - Duration slider (dynamic max)       │
│  - Show capabilities    │  - Adapter selector                    │
│         │               │  - Model capability hints              │
│         │               │         │                              │
│         └───────────────┴─────────┘                              │
│                         │                                        │
│                    GET /models                                   │
│                    GET /adapters                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend                                   │
├─────────────────────────────────────────────────────────────────┤
│                    Model Registry                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ MODEL_CONFIGS = {                                        │    │
│  │   "facebook/musicgen-small": {                           │    │
│  │     "display_name": "MusicGen Small",                    │    │
│  │     "max_duration_seconds": 30,                          │    │
│  │     "tokens_per_second": 50,                             │    │
│  │     "vram_gb": 4,                                        │    │
│  │     "sample_rate": 32000,                                │    │
│  │   },                                                     │    │
│  │   "facebook/musicgen-medium": { ... },                   │    │
│  │   "facebook/musicgen-large": { ... },                    │    │
│  │ }                                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│            ┌─────────────┴─────────────┐                        │
│            ▼                           ▼                        │
│     Generation Service          Adapter Service                  │
│     - Validate duration         - Include model info             │
│     - Calculate tokens          - Compatibility check            │
└─────────────────────────────────────────────────────────────────┘
```

## Model Registry Design

### Configuration Structure

```python
# backend/app/models/model_registry.py

MODEL_CONFIGS: dict[str, ModelConfig] = {
    "facebook/musicgen-small": ModelConfig(
        id="musicgen-small",
        display_name="MusicGen Small",
        hf_model_id="facebook/musicgen-small",
        max_duration_seconds=30,
        recommended_duration_seconds=10,
        tokens_per_second=50,
        vram_requirement_gb=4,
        sample_rate=32000,
        description="Fast generation, good for prototyping",
    ),
    "facebook/musicgen-medium": ModelConfig(
        id="musicgen-medium",
        display_name="MusicGen Medium",
        hf_model_id="facebook/musicgen-medium",
        max_duration_seconds=30,
        recommended_duration_seconds=15,
        tokens_per_second=50,
        vram_requirement_gb=8,
        sample_rate=32000,
        description="Balanced quality and speed",
    ),
    "facebook/musicgen-large": ModelConfig(
        id="musicgen-large",
        display_name="MusicGen Large",
        hf_model_id="facebook/musicgen-large",
        max_duration_seconds=30,
        recommended_duration_seconds=10,
        tokens_per_second=50,
        vram_requirement_gb=16,
        sample_rate=32000,
        description="Highest quality, requires more VRAM",
    ),
}
```

### Why These Limits?

MusicGen uses approximately 50 tokens per second of audio. The model's context window and VRAM constraints limit the practical maximum duration:

| Model | VRAM | Practical Max Duration |
|-------|------|----------------------|
| Small | 4GB  | ~30 seconds |
| Medium | 8GB | ~30 seconds |
| Large | 16GB | ~30 seconds |

Note: While theoretically longer durations are possible, quality degrades and CUDA errors become more likely. The 30-second limit is a safe default that works reliably across hardware.

## API Design

### GET /models

Returns available models with their capabilities.

**Response:**
```json
{
  "models": [
    {
      "id": "musicgen-small",
      "display_name": "MusicGen Small",
      "hf_model_id": "facebook/musicgen-small",
      "max_duration_seconds": 30,
      "recommended_duration_seconds": 10,
      "vram_requirement_gb": 4,
      "sample_rate": 32000,
      "description": "Fast generation, good for prototyping",
      "is_active": true
    }
  ],
  "current_model": "musicgen-small"
}
```

### Updated Adapter Response

Include model info for UI filtering:

```json
{
  "id": "...",
  "name": "My Adapter",
  "base_model": "facebook/musicgen-small",
  "base_model_config": {
    "max_duration_seconds": 30,
    "display_name": "MusicGen Small"
  }
}
```

## Frontend Integration

### PromptEditor Changes

```typescript
// Filter adapters to show only those compatible with current model
const compatibleAdapters = adapters.filter(
  a => a.base_model === currentModel.hf_model_id
);

const incompatibleAdapters = adapters.filter(
  a => a.base_model !== currentModel.hf_model_id
);

// Adapter selector shows:
// - Compatible adapters: selectable
// - Incompatible adapters: disabled with hint "Requires [Model Name]"
```

```typescript
// Duration limits based on current model (not adapter)
// Since adapter must match current model, they share the same limits
useEffect(() => {
  setMaxDuration(currentModelConfig?.max_duration_seconds ?? 30);
  
  // Clamp current duration if it exceeds max
  if (duration > currentModelConfig?.max_duration_seconds) {
    setDuration(currentModelConfig?.max_duration_seconds ?? 30);
  }
}, [currentModelConfig]);
```

### Settings Page Changes

- Fetch models from `/models` endpoint
- Display model capabilities (VRAM, max duration)
- Show warning if selected model exceeds available VRAM
- "Reload Model" actually triggers model switch (requires backend restart notification)
- **Note**: Changing model affects which adapters are available in Generate page

### Adapter Compatibility UX

```
Adapter Selector in Generate Page:
┌─────────────────────────────────────────┐
│ LoRA Adapter                        [▼] │
├─────────────────────────────────────────┤
│ ✓ None (base model)                     │
│ ✓ My Jazz Adapter v1.0                  │  ← Compatible
│ ✓ Electronic Style v2.1                 │  ← Compatible
│ ─────────────────────────────────       │
│ 🔒 Classical Large (Requires Large)     │  ← Incompatible, disabled
│ 🔒 Orchestra HD (Requires Medium)       │  ← Incompatible, disabled
└─────────────────────────────────────────┘

Hint below selector:
"Some adapters are hidden because they require a different model.
 Change model in Settings to access them."
```

## Validation Flow

```
User submits generation
         │
         ▼
┌─────────────────────────┐
│ Get model config        │
│ (from adapter or base)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ duration <= max_duration?│
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │ Yes         │ No
     ▼             ▼
  Proceed     Return 400 error:
              "Duration {X}s exceeds
               model limit of {Y}s"
```

## Migration Path

1. **Phase 1**: Add model registry and `/models` endpoint (no breaking changes)
2. **Phase 2**: Update frontend to use model capabilities
3. **Phase 3**: Add backend validation (may reject previously accepted requests)
4. **Phase 4**: Connect Settings page to actual backend config

## Trade-offs

### Chosen Approach: Static Model Registry
**Pros:**
- Simple to implement and maintain
- Predictable behavior
- No runtime overhead

**Cons:**
- Requires code change to add new models
- Limits may not match actual hardware capabilities

### Alternative: Dynamic Capability Detection
**Pros:**
- Adapts to actual hardware
- More accurate limits

**Cons:**
- Complex to implement
- Unpredictable behavior across environments
- Requires GPU probing at startup

We chose static registry for simplicity and predictability. Users with better hardware can override limits via environment variables if needed.
