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

## MODIFIED Requirements

### Requirement: Training Log Streaming

The system SHALL provide real-time streaming of training logs for experiment runs.

#### Scenario: View live training logs (MODIFIED)

- **WHEN** a user opens the detail view of a running experiment run
- **THEN** the system displays the training terminal output in real-time
- **AND** supports terminal features including carriage returns and ANSI colors
- **AND** the terminal panel remains visible in a fixed position while scrolling

#### Scenario: Switch between run logs

- **WHEN** a user switches from viewing one run's logs to another run's logs
- **THEN** the system clears the terminal display
- **AND** shows a loading indicator while fetching history
- **AND** loads and displays the new run's log history
- **AND** displays "Waiting for logs..." if the run has no logs yet and is live

#### Scenario: View logs with empty history

- **WHEN** a user views a live run that has not produced any log output yet
- **THEN** the system displays "Waiting for logs..." message in the terminal
- **AND** begins streaming new logs as they become available

### Requirement: Experiment Detail Page Layout

The system SHALL display experiment details in an optimized layout.

#### Scenario: Split-pane layout

- **WHEN** a user views the experiment detail page
- **THEN** the page displays in a two-column layout on desktop
- **AND** the left column contains experiment overview and runs table (scrollable)
- **AND** the right column contains the terminal panel (fixed position)
- **AND** both columns are independently scrollable

#### Scenario: Run selector in terminal panel

- **WHEN** a user views the terminal panel
- **THEN** the panel displays tabs for runs with available logs
- **AND** clicking a tab switches the terminal to that run's logs
- **AND** the active tab is visually highlighted

#### Scenario: Responsive layout

- **WHEN** a user views the experiment detail page on a narrow screen
- **THEN** the layout switches to a single-column stacked view
- **AND** the terminal panel appears below the runs table
