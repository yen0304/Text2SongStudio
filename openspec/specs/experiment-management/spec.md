# experiment-management Specification

## Purpose
TBD - created by archiving change redesign-dashboard-ui. Update Purpose after archive.
## Requirements
### Requirement: Experiment CRUD
The system SHALL allow users to create, read, update, and delete experiments.

#### Scenario: Create experiment
- **WHEN** a user creates an experiment with a name and dataset reference
- **THEN** the system creates the experiment record
- **AND** returns the experiment ID for tracking

#### Scenario: List experiments
- **WHEN** a user requests the experiment list
- **THEN** the system returns experiments with name, run count, best metrics, status, and dates
- **AND** supports pagination and filtering by status

#### Scenario: Get experiment detail
- **WHEN** a user requests an experiment by ID
- **THEN** the system returns full experiment info including all runs and aggregated metrics

#### Scenario: Delete experiment
- **WHEN** a user deletes an experiment
- **THEN** the system marks the experiment as deleted (soft delete)
- **AND** retains run history for audit purposes

### Requirement: Experiment Runs
The system SHALL track individual training runs within an experiment.

#### Scenario: Start training run
- **WHEN** a user starts a run with training configuration
- **THEN** the system creates a run record linked to the experiment
- **AND** queues the training job
- **AND** returns a run ID for status tracking

#### Scenario: List runs for experiment
- **WHEN** a user requests runs for an experiment
- **THEN** the system returns runs with config, metrics summary, status, and resulting adapter
- **AND** orders by creation date descending

#### Scenario: Get run metrics
- **WHEN** a user requests metrics for a run
- **THEN** the system returns time-series metrics (loss, learning rate, etc.)
- **AND** includes final metrics summary

#### Scenario: Compare runs
- **WHEN** a user selects multiple runs for comparison
- **THEN** the system returns side-by-side metrics for the selected runs
- **AND** highlights the best performing run per metric

### Requirement: Run-to-Adapter Linking
The system SHALL automatically link completed runs to their resulting adapters.

#### Scenario: Link adapter after training
- **WHEN** a training run completes successfully
- **THEN** the system links the new adapter to the run
- **AND** updates the experiment's best metrics if improved

#### Scenario: Navigate from run to adapter
- **WHEN** a user views a completed run
- **THEN** the system provides a link to the resulting adapter
- **AND** shows the adapter's version in the run summary

### Requirement: Experiment Status Tracking
The system SHALL track experiment lifecycle status.

#### Scenario: Update status on run start
- **WHEN** a run starts within an experiment
- **THEN** the experiment status changes to "running" if not already

#### Scenario: Update status on all runs complete
- **WHEN** all runs in an experiment reach terminal state (completed/failed)
- **THEN** the experiment status changes to "completed"

#### Scenario: Mark experiment as failed
- **WHEN** all runs in an experiment fail
- **THEN** the experiment status changes to "failed"
- **AND** the last error message is preserved

