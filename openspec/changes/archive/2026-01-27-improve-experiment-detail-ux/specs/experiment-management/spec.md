## ADDED Requirements

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

#### Scenario: Tabbed interface

- **WHEN** a user views the experiment detail page
- **THEN** the page displays three tabs: Runs, Overview, and Config
- **AND** the Runs tab contains the runs table and terminal panel
- **AND** the Overview tab displays experiment statistics and metrics
- **AND** the Config tab shows experiment configuration details

#### Scenario: Runs pagination

- **WHEN** a user views the runs table in the Runs tab
- **THEN** the table displays 10 runs per page
- **AND** provides pagination controls to navigate between pages
- **AND** displays the current page number and total pages

#### Scenario: Run selector in terminal panel

- **WHEN** a user views the terminal panel in the Runs tab
- **THEN** the panel displays tabs for runs with available logs
- **AND** clicking a tab switches the terminal to that run's logs
- **AND** the active tab is visually highlighted

## MODIFIED Requirements

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
