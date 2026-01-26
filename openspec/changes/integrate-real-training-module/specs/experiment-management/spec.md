# experiment-management Specification Delta

## MODIFIED Requirements

### Requirement: Experiment Runs

The system SHALL track individual training runs within an experiment.

#### Scenario: Start training run

- **WHEN** a user starts a run with training configuration
- **THEN** the system validates a dataset is linked to the experiment
- **AND** exports the dataset to JSONL format for training
- **AND** creates a run record linked to the experiment
- **AND** spawns a training subprocess with real MusicGen + LoRA training
- **AND** returns a run ID for status tracking

#### Scenario: Start training run without dataset

- **WHEN** a user attempts to start a run on an experiment with no dataset
- **THEN** the system returns an error indicating dataset is required
- **AND** does not create a run record

#### Scenario: Get run metrics

- **WHEN** a user requests metrics for a completed run
- **THEN** the system returns actual training metrics (loss, learning rate)
- **AND** includes the `adapter_id` of the registered adapter
- **AND** includes `final_loss` from real training output

### Requirement: Run-to-Adapter Linking

The system SHALL automatically link completed runs to their resulting adapters.

#### Scenario: Link adapter after training

- **WHEN** a training run completes successfully
- **THEN** the system creates an Adapter record from training output
- **AND** links the new adapter to the run via `adapter_id`
- **AND** updates the experiment's best metrics if this run improved them
- **AND** adapter name follows pattern `{experiment_name}-{run_name}`
