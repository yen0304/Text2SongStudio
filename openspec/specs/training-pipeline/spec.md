# training-pipeline Specification

## Purpose
TBD - created by archiving change add-text2song-studio. Update Purpose after archive.
## Requirements
### Requirement: Supervised Fine-Tuning

The system SHALL support supervised fine-tuning of LoRA adapters using rated samples.

#### Scenario: Train on high-rated samples

- **WHEN** a user initiates supervised training with a dataset of high-rated samples
- **THEN** the system trains a LoRA adapter to reproduce the characteristics of those samples
- **AND** uses the prompt text as conditioning input

#### Scenario: Configure training hyperparameters

- **WHEN** a user specifies training hyperparameters (learning rate, epochs, batch size, LoRA rank)
- **THEN** the system uses the specified configuration
- **AND** validates hyperparameters are within acceptable ranges

#### Scenario: Resume training from checkpoint

- **WHEN** a user resumes training from a saved checkpoint
- **THEN** the system loads the checkpoint state (optimizer, scheduler, epoch)
- **AND** continues training from the interrupted point

### Requirement: Preference-Based Training

The system SHALL support preference-based training using pairwise feedback.

#### Scenario: Train with DPO objective

- **WHEN** a user initiates preference training with a preference dataset
- **THEN** the system trains using Direct Preference Optimization (DPO)
- **AND** optimizes the adapter to prefer "chosen" samples over "rejected" samples

#### Scenario: Train with ranking loss

- **WHEN** a user initiates training with ranked samples
- **THEN** the system uses a ranking loss function (e.g., margin ranking loss)
- **AND** learns to order samples according to human preferences

### Requirement: Training Progress Monitoring

The system SHALL provide training progress monitoring and logging.

#### Scenario: Log training metrics

- **WHEN** training is in progress
- **THEN** the system logs loss, learning rate, and gradient norms at regular intervals
- **AND** metrics are accessible via API or log files

#### Scenario: Save checkpoints

- **WHEN** training completes an epoch or reaches a checkpoint interval
- **THEN** the system saves the adapter weights and optimizer state
- **AND** retains the N most recent checkpoints (configurable)

#### Scenario: Early stopping

- **WHEN** validation loss does not improve for a configured number of epochs
- **THEN** the system stops training early
- **AND** retains the best-performing checkpoint

### Requirement: Training Execution

The system SHALL support flexible training execution environments.

#### Scenario: Execute training via CLI

- **WHEN** a user runs the training CLI with a dataset path and configuration
- **THEN** the system loads the MusicGen model with LoRA configuration
- **AND** trains on the provided dataset
- **AND** outputs progress to stdout with real loss values

#### Scenario: Execute training as background job

- **WHEN** a user submits a training job via API (experiment run)
- **THEN** the system exports the linked dataset to JSONL format
- **AND** spawns a subprocess running `model.training.cli`
- **AND** captures stdout/stderr for log streaming
- **AND** provides run ID for status polling

### Requirement: Post-Training Registration

The system SHALL automatically register trained adapters.

#### Scenario: Register adapter after successful training

- **WHEN** training completes successfully (exit code 0)
- **THEN** the system reads `training_config.json` from output directory
- **AND** creates an Adapter record with name, version, and storage path
- **AND** links the adapter to its training dataset and experiment run
- **AND** updates the run record with `adapter_id` and `final_loss`

#### Scenario: Handle training failure

- **WHEN** training fails (non-zero exit code)
- **THEN** the system sets run status to `FAILED`
- **AND** stores the error message from stderr
- **AND** preserves any checkpoint files for debugging
- **AND** does NOT register an adapter

