# training-pipeline Specification Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Simulated Training

The system no longer provides simulated/placeholder training.

#### Scenario: Simulate training progress (REMOVED)

- ~~WHEN a training run starts~~
- ~~THEN the system simulates progress with artificial delays~~
- ~~AND generates fake loss values~~

**Reason**: Replaced with real MusicGen + LoRA training implementation.
