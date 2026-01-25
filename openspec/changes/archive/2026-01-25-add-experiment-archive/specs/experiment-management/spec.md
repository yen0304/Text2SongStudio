# experiment-management Specification (Delta)

## MODIFIED Requirements

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

## ADDED Requirements

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
