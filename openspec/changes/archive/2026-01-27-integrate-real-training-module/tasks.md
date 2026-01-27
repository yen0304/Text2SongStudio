# Tasks: Integrate Real Training Module

## Pre-Implementation

- [x] Verify `model/training/` works standalone (`python -m model.training.cli train --help`)
- [x] Ensure dataset export produces correct JSONL format for training

## Implementation Tasks

### Phase 1: Update TrainingService

- [x] **1.1** Modify `_build_training_command()` to call `model.training.cli` instead of `app.training.cli`
- [x] **1.2** Add dataset export step before spawning training subprocess
- [x] **1.3** Set `PYTHONPATH` environment variable to include project root
- [x] **1.4** Map experiment config fields to TrainingConfig CLI arguments
- [x] **1.5** Generate unique output directory path per run (`./adapters/{exp_id}/{run_id}/`)

### Phase 2: Post-Training Integration

- [x] **2.1** After successful training, read `training_config.json` from output directory
- [x] **2.2** Create Adapter record with metadata from training output
- [x] **2.3** Update ExperimentRun with `adapter_id` and `final_loss`
- [x] **2.4** Parse final loss from training logs or config file

### Phase 3: Error Handling

- [x] **3.1** Validate dataset exists before starting training
- [x] **3.2** Handle dataset export failures gracefully
- [x] **3.3** Preserve partial outputs (checkpoints) on training failure

### Phase 4: Cleanup

- [x] **4.1** Delete `backend/app/training/cli.py` (placeholder simulation)
- [x] **4.2** Delete `backend/app/training/__init__.py` (if empty)
- [x] **4.3** Remove any imports of `app.training` from codebase

## Validation

- [x] **5.1** Test: Start training run with supervised dataset → adapter created
- [x] **5.2** Test: Start training run with preference dataset → adapter created
- [x] **5.3** Test: Training logs show real PyTorch output
- [x] **5.4** Test: Failed training shows error in run record
- [x] **5.5** Test: Run without dataset fails with clear error message

## Dependencies

- Phase 2 depends on Phase 1
- Phase 4 depends on Phase 1-3 passing tests
- Training requires GPU (tests may need mocking on CI)
