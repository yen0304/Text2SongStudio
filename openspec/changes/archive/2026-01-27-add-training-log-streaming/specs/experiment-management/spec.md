## ADDED Requirements

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
