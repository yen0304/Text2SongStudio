# Proposal: Integrate Real Training Module

## Summary

Integrate the existing real training module (`model/training/`) into the backend's experiment/training workflow, replacing the current placeholder simulation. This enables actual MusicGen + LoRA training via the web UI.

## Problem Statement

Currently, when a user starts a training run via the Experiments UI:

1. **Training is simulated** - `backend/app/training/cli.py` uses `simulate_training()` with `time.sleep()` to fake progress
2. **No real model training** - Loss values are fabricated using formulas like `2.5 - (epoch * 0.2)`
3. **No adapter output** - No actual LoRA weights are produced
4. **Disconnected code** - Real training logic exists in `model/training/` but is not integrated

The real training module in `model/training/` has complete implementations:
- `supervised.py` - MusicGen + LoRA supervised fine-tuning with PyTorch
- `preference.py` - DPO (Direct Preference Optimization) training
- `config.py` - TrainingConfig dataclass with all hyperparameters
- `cli.py` - CLI that calls real training functions

## Proposed Solution

### 1. Replace Placeholder Training CLI

Remove `backend/app/training/cli.py` (the fake training) and modify `TrainingService` to call `model/training/cli.py` (the real training).

### 2. Update TrainingService Command Builder

Modify `_build_training_command()` to:
- Call `python -m model.training.cli train` instead of `python -m app.training.cli train`
- Pass dataset path (from exported dataset file)
- Pass training config (epochs, batch_size, learning_rate, lora_r, etc.)
- Pass output directory for adapter storage
- Pass adapter name derived from experiment/run

### 3. Wire Up Dataset → Training

When starting a run:
1. Export the experiment's linked dataset to JSONL format
2. Pass the export path to the training CLI
3. Training reads the JSONL and loads audio files

### 4. Wire Up Training → Adapter Registration

After successful training:
1. Parse the output adapter path from training logs
2. Create an Adapter record linked to the run
3. Update run with `adapter_id` and `final_loss`

### 5. Delete Placeholder Code

Remove:
- `backend/app/training/cli.py` - Entire file (placeholder)
- `backend/app/training/__init__.py` - If empty after removal

## Data Flow

```
[Experiment UI] → Start Run
        │
        ▼
[TrainingService.start_training()]
        │
        ├─► Export dataset to JSONL (if dataset_id exists)
        │
        ▼
[subprocess: python -m model.training.cli train]
        │
        ├─► Load MusicGen + LoRA
        ├─► Train on dataset
        ├─► Save adapter weights
        │
        ▼
[TrainingService: on completion]
        │
        ├─► Register Adapter
        └─► Update Run with adapter_id, final_loss
```

## Impact Assessment

| Area | Impact |
|------|--------|
| Backend Code | Modify `TrainingService`, delete placeholder CLI |
| Model Code | No changes (already complete) |
| Database | No schema changes |
| Frontend | No changes (already shows run status/logs) |
| Dependencies | Backend may need `model/` in Python path |
| Training Logs | Real output from actual training |

## Configuration Mapping

| Experiment Config | TrainingConfig Field |
|-------------------|---------------------|
| `config.epochs` | `num_epochs` |
| `config.batch_size` | `batch_size` |
| `config.learning_rate` | `learning_rate` |
| `config.lora_r` | `lora_r` |
| `config.lora_alpha` | `lora_alpha` |
| `config.training_type` | `dataset_type` (supervised/preference) |

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Integrate existing module** | Real training, code already exists | Requires GPU |
| Keep simulation with flag | Supports dev without GPU | Maintains dead code |
| Rewrite training in backend | Single codebase | Duplicates `model/training/` |

## Success Criteria

- [ ] Starting a run executes real MusicGen + LoRA training
- [ ] Training logs show actual loss values from PyTorch
- [ ] Adapter weights are saved to disk
- [ ] Adapter is registered in database after successful training
- [ ] Run record links to created adapter
- [ ] Placeholder training code is deleted
- [ ] Training works with both supervised and preference datasets
