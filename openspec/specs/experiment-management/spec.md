# experiment-management Specification

## Purpose
TBD - created by archiving change redesign-dashboard-ui. Update Purpose after archive.
## Requirements
### Requirement: Experiment CRUD
The system SHALL allow users to create, read, update, and delete experiments.

#### Scenario: Delete experiment (renamed to Archive)
- **WHEN** a user archives an experiment by ID
- **THEN** the system sets the experiment status to `ARCHIVED`
- **AND** returns HTTP 200 with the updated experiment
- **AND** the experiment no longer appears in the default list view

#### Scenario: List experiments excludes archived by default
- **WHEN** a user requests the experiment list without filters
- **THEN** the system returns only experiments where status is not `ARCHIVED`
- **AND** archived experiments are excluded from the response

#### Scenario: List experiments with archived filter
- **WHEN** a user requests the experiment list with `include_archived=true`
- **THEN** the system returns all experiments including archived ones
- **AND** archived experiments are visually distinguished in the response

#### Scenario: Unarchive experiment
- **WHEN** a user unarchives an archived experiment
- **THEN** the system sets the experiment status to `DRAFT`
- **AND** returns HTTP 200 with the updated experiment
- **AND** the experiment appears in the default list view again

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

### Requirement: Experiment Archive UI
The system SHALL provide a user interface for archiving experiments.

#### Scenario: Archive button on experiment card
- **WHEN** a user views the experiments list
- **THEN** each non-archived experiment displays an archive option
- **AND** the option is accessible via a menu or icon button

#### Scenario: Confirmation dialog before archive
- **WHEN** a user clicks the archive option
- **THEN** the system displays a confirmation dialog
- **AND** shows the experiment name being archived
- **AND** explains that the experiment can be unarchived later

#### Scenario: Execute archive after confirmation
- **WHEN** a user confirms the archive action
- **THEN** the system calls the archive API
- **AND** removes the experiment from the displayed list (if not showing archived)
- **AND** shows a success notification

#### Scenario: Show archived toggle
- **WHEN** a user wants to view archived experiments
- **THEN** the system provides a toggle or filter option
- **AND** enabling it shows archived experiments with visual distinction

#### Scenario: Unarchive from archived view
- **WHEN** a user views an archived experiment
- **THEN** the system displays an unarchive button
- **AND** clicking it restores the experiment to active status

### Requirement: Training Log Streaming

The system SHALL provide real-time streaming of training logs for experiment runs.

#### Scenario: View live training logs

- **WHEN** a user opens the detail view of a running experiment run
- **THEN** the system displays the training terminal output in real-time
- **AND** supports terminal features including carriage returns and ANSI colors

#### Scenario: View historical logs

- **WHEN** a user views a completed or failed experiment run
- **THEN** the system displays the full training log history
- **AND** the log is rendered as it appeared in the original terminal

#### Scenario: Navigate away and return

- **WHEN** a user navigates away from the run detail page during training
- **AND** returns to the page later
- **THEN** the system displays the complete log history up to that point
- **AND** resumes live streaming if the run is still in progress

#### Scenario: Training completes while viewing

- **WHEN** a user is viewing live training logs
- **AND** the training run completes (success or failure)
- **THEN** the system displays the final log output
- **AND** indicates that the run has finished

### Requirement: Training Log Persistence

The system SHALL persist training logs for all experiment runs.

#### Scenario: Store logs during training

- **WHEN** a training run is in progress
- **THEN** the system captures stdout and stderr from the training process
- **AND** stores the raw terminal output including control characters

#### Scenario: Retrieve logs after training

- **WHEN** a user requests logs for a past experiment run
- **THEN** the system returns the complete stored log data
- **AND** the log can be rendered to reproduce the original terminal output

