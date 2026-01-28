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

#### Scenario: View live training logs (MODIFIED)

- **WHEN** a user opens the detail view of a running experiment run
- **THEN** the system displays the training terminal output in real-time
- **AND** supports terminal features including carriage returns and ANSI colors
- **AND** the terminal display is integrated within the Runs tab

#### Scenario: Switch between run logs (MODIFIED)

- **WHEN** a user switches from viewing one run's logs to another run's logs
- **THEN** the system clears the terminal display
- **AND** shows a loading indicator while fetching history
- **AND** loads and displays the new run's log history
- **AND** displays "Select a run to view logs" if no run is selected

#### Scenario: View logs with empty history

- **WHEN** a user views a live run that has not produced any log output yet
- **THEN** the system displays the terminal with an empty state
- **AND** begins streaming new logs as they become available

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

### Requirement: Run Deletion

The system SHALL allow users to delete experiment runs that are in a terminal state.

#### Scenario: Delete failed run

- **WHEN** a user requests to delete a run with status `FAILED`
- **THEN** the system deletes the run record from the database
- **AND** deletes associated training logs (via cascade)
- **AND** deletes the adapter output directory if it exists
- **AND** returns HTTP 204

#### Scenario: Delete completed run

- **WHEN** a user requests to delete a run with status `COMPLETED`
- **THEN** the system deletes the run record from the database
- **AND** deletes associated training logs (via cascade)
- **AND** deletes the adapter output directory if it exists
- **AND** unlinks the adapter record from the run (adapter is preserved)
- **AND** returns HTTP 204

#### Scenario: Delete run that was best run

- **WHEN** a user deletes a run that is the experiment's `best_run_id`
- **THEN** the system recalculates the best run from remaining completed runs
- **AND** updates the experiment's `best_run_id` and `best_loss` accordingly
- **AND** sets `best_run_id` and `best_loss` to null if no completed runs remain

#### Scenario: Attempt to delete running run

- **WHEN** a user attempts to delete a run with status `RUNNING` or `PENDING`
- **THEN** the system returns HTTP 400 with error message
- **AND** does not delete the run

#### Scenario: Attempt to delete non-existent run

- **WHEN** a user attempts to delete a run that does not exist
- **THEN** the system returns HTTP 404

### Requirement: Run Deletion UI

The system SHALL provide a user interface for deleting experiment runs.

#### Scenario: Delete button visibility

- **WHEN** a user views the runs table in the experiment detail page
- **THEN** runs with status `FAILED`, `COMPLETED`, or `CANCELLED` display a delete button
- **AND** runs with status `RUNNING` or `PENDING` do not display a delete button

#### Scenario: Delete confirmation

- **WHEN** a user clicks the delete button on a run
- **THEN** the system displays a confirmation dialog
- **AND** shows the run name being deleted
- **AND** warns that this action cannot be undone

#### Scenario: Execute deletion

- **WHEN** a user confirms the deletion
- **THEN** the system calls the delete API
- **AND** removes the run from the displayed list
- **AND** shows a success notification

### Requirement: Batch Run Deletion

The system SHALL allow users to delete multiple experiment runs at once.

#### Scenario: Batch delete multiple runs

- **WHEN** a user selects multiple runs with checkboxes
- **THEN** a "Delete Selected" button appears
- **AND** only runs in terminal states (completed, failed, cancelled) can be selected for deletion

#### Scenario: Batch delete confirmation

- **WHEN** a user clicks the "Delete Selected" button
- **THEN** the system displays a confirmation dialog
- **AND** shows the count of runs to be deleted
- **AND** warns that this action cannot be undone

#### Scenario: Execute batch deletion

- **WHEN** a user confirms the batch deletion
- **THEN** the system calls DELETE /experiments/{id}/runs with run IDs as query parameters
- **AND** deletes all selected runs and their associated data
- **AND** removes the deleted runs from the displayed list
- **AND** shows a success notification

### Requirement: Experiment Detail Page Layout

The system SHALL display experiment details in a tabbed layout.

#### Scenario: Config tab displays editable form

- **WHEN** a user views the Config tab of an experiment
- **THEN** the tab displays an editable configuration form
- **AND** the form shows parameters grouped by category with tooltips
- **AND** replaces the previous raw JSON display

### Requirement: Experiment Configuration Form

The system SHALL provide a form interface for configuring training hyperparameters when creating experiments.

#### Scenario: Configure training parameters during experiment creation

- **GIVEN** a user is creating a new experiment
- **WHEN** the user expands the "Training Configuration" section
- **THEN** the system displays form inputs for training hyperparameters
- **AND** inputs are grouped by category (Training, LoRA, Hardware)
- **AND** each input shows a tooltip explaining the parameter

#### Scenario: Create experiment with custom config

- **WHEN** a user submits the experiment creation form with custom config values
- **THEN** the system saves the config along with name, description, and dataset
- **AND** the config appears in the experiment's Config tab

#### Scenario: Create experiment with default config

- **WHEN** a user submits the experiment creation form without modifying config
- **THEN** the system saves sensible default values for training parameters
- **AND** defaults match the values in TrainingConfig dataclass

### Requirement: Experiment Configuration Editing

The system SHALL allow users to edit training configuration on existing experiments.

#### Scenario: View config in editable form

- **GIVEN** a user views the Config tab of an experiment
- **WHEN** the page loads
- **THEN** the system displays the config in an editable form layout
- **AND** shows the same grouped structure as the creation form
- **AND** displays an "Edit" button to enable editing

#### Scenario: Edit and save config

- **GIVEN** a user is editing experiment config
- **WHEN** the user modifies parameter values and clicks "Save Changes"
- **THEN** the system updates the experiment's config via API
- **AND** displays a success notification
- **AND** exits edit mode

#### Scenario: Cancel config editing

- **GIVEN** a user is editing experiment config
- **WHEN** the user clicks "Cancel"
- **THEN** the system reverts to the original config values
- **AND** exits edit mode without saving

### Requirement: Run Configuration Override

The system SHALL allow users to override experiment config when starting a run.

#### Scenario: Start run with config override

- **GIVEN** a user is starting a new run on an experiment
- **WHEN** the user opens the start run dialog
- **THEN** the system shows the experiment's config as defaults
- **AND** provides an "Override Configuration" section
- **AND** allows modification of specific parameters

#### Scenario: Run uses override values

- **WHEN** a user starts a run with modified config values
- **THEN** the run record stores only the overridden values
- **AND** training uses the overridden values merged with experiment defaults

#### Scenario: Run uses experiment defaults

- **WHEN** a user starts a run without modifying config
- **THEN** the run record stores null or empty config
- **AND** training uses the experiment's config values

