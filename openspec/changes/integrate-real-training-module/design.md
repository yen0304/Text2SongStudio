# Design: Integrate Real Training Module

## Architecture Overview

This change connects three existing components:
1. **TrainingService** (backend) - Orchestrates training runs
2. **model/training/** - Real PyTorch training implementation
3. **Adapter Registry** (backend) - Stores trained adapter metadata

```
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
│  ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐ │
│  │ Experiments  │────►│ TrainingService │────►│   Adapters   │ │
│  │   Router     │     │                 │     │   Registry   │ │
│  └──────────────┘     └────────┬────────┘     └──────────────┘ │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │ subprocess
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       model/training/                            │
│  ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐ │
│  │   cli.py     │────►│  supervised.py  │────►│ LoRA Weights │ │
│  │              │     │  preference.py  │     │   (output)   │ │
│  └──────────────┘     └─────────────────┘     └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Subprocess Communication

**Decision**: Continue using subprocess to run training.

**Rationale**:
- Isolates GPU memory from web server process
- Allows training to use all available GPU resources
- Log streaming already implemented via `LogCaptureService`
- Matches existing architecture pattern

**Alternative Rejected**: In-process training
- Would block/slow web server
- GPU memory leaks could crash server
- Harder to recover from training crashes

### 2. Dataset Export Strategy

**Decision**: Export dataset to JSONL before training.

**Approach**:
1. When run starts, export linked dataset to `./exports/{dataset_id}/data.jsonl`
2. Pass this path to training CLI
3. Training reads JSONL + loads referenced audio files

**File Format** (JSONL):
```json
// Supervised
{"prompt": "upbeat electronic music", "audio_path": "/storage/audio/abc123.wav", "rating": 5}

// Preference
{"prompt": "calm ambient", "chosen_path": "/storage/audio/a.wav", "rejected_path": "/storage/audio/b.wav"}
```

**Rationale**:
- Decouples training from database access
- Training module doesn't need DB connection
- Dataset export already implemented in `DatasetService`

### 3. Adapter Output Path Convention

**Decision**: Use structured output path for adapter weights.

**Path Pattern**:
```
./adapters/{experiment_id}/{run_id}/
├── final/              # Final adapter weights
├── best/               # Best checkpoint (if early stopping)
├── checkpoint-500/     # Intermediate checkpoints
└── training_config.json
```

**Rationale**:
- Unique per run (no collisions)
- Easy to locate from run record
- Matches existing `model/training/` output structure

### 4. Adapter Auto-Registration

**Decision**: TrainingService registers adapter after successful training.

**Flow**:
1. Training subprocess exits with code 0
2. TrainingService reads `training_config.json` from output dir
3. Creates Adapter record with:
   - `name`: `{experiment_name}-{run_name}`
   - `version`: Timestamp-based (e.g., `2026.01.26.1`)
   - `storage_path`: Output directory path
   - `training_config`: From saved JSON
   - `training_dataset_id`: From experiment
4. Updates Run record with `adapter_id`

### 5. Training Type Detection

**Decision**: Infer training type from dataset type.

**Logic**:
```python
if dataset.type == DatasetType.SUPERVISED:
    training_type = "supervised"
else:
    training_type = "preference"
```

**Rationale**:
- Dataset type already stored in database
- Simplifies UI (no need to select training type separately)
- Matches natural workflow: supervised dataset → supervised training

## Error Handling

### Training Failure

When training subprocess exits non-zero:
1. Run status → `FAILED`
2. `run.error` populated from stderr/exit code
3. No adapter registered
4. Partial outputs (checkpoints) preserved for debugging

### Missing Dataset

When experiment has no `dataset_id`:
1. Return error before spawning subprocess
2. "Dataset required for training" message
3. Run status → `FAILED`

### Invalid Dataset

When dataset export fails or produces empty file:
1. Run status → `FAILED`
2. `run.error` = "Dataset export failed" or "Dataset is empty"

## Configuration Defaults

When experiment config is partial, use these defaults:

| Field | Default | Notes |
|-------|---------|-------|
| `epochs` | 3 | From `TrainingConfig.num_epochs` |
| `batch_size` | 2 | GPU memory safe |
| `learning_rate` | 1e-4 | Standard for LoRA |
| `lora_r` | 16 | Balance size/quality |
| `lora_alpha` | 32 | 2x lora_r convention |

## Python Path Considerations

The `model/` directory is at project root, not inside `backend/`.

**Solution**: Set `PYTHONPATH` when spawning subprocess:
```python
env = os.environ.copy()
env["PYTHONPATH"] = str(Path(__file__).parents[3])  # Project root
process = await asyncio.create_subprocess_exec(*cmd, env=env, ...)
```

This allows `python -m model.training.cli` to find the module.
