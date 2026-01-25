## MODIFIED Requirements

### Requirement: Adapter Lifecycle Management

The system SHALL support adapter activation, deactivation, deletion, and versioning.

#### Scenario: Activate adapter

- **WHEN** a user activates an adapter
- **THEN** the adapter becomes available for selection in generation requests
- **AND** the system pre-loads the adapter if resources permit

#### Scenario: Deactivate adapter

- **WHEN** a user deactivates an adapter
- **THEN** the adapter is no longer available for new generation requests
- **AND** existing jobs using the adapter continue to completion

#### Scenario: Delete adapter (soft-delete)

- **WHEN** a user deletes an adapter
- **THEN** the system sets the adapter's `deleted_at` timestamp
- **AND** the adapter no longer appears in adapter listings
- **AND** the adapter cannot be used for new generation requests
- **AND** existing jobs that used the adapter retain their historical reference
- **AND** jobs list shows "Deleted Adapter" indicator for these jobs

#### Scenario: Attempt to delete non-existent adapter

- **WHEN** a user requests deletion of an adapter that does not exist
- **THEN** the system returns a 404 not-found error

#### Scenario: Attempt to delete already-deleted adapter

- **WHEN** a user requests deletion of a soft-deleted adapter
- **THEN** the system returns a 404 not-found error

#### Scenario: Compare adapter versions

- **WHEN** a user requests comparison between adapter versions
- **THEN** the system returns metrics for each version (average rating, preference win rate)
- **AND** identifies statistically significant differences

### Requirement: Adapter Listing and Discovery

The system SHALL allow users to discover and browse available adapters.

#### Scenario: List adapters with activation status

- **WHEN** a user requests a list of adapters via UI
- **THEN** the system clearly indicates which adapters are currently active
- **AND** excludes soft-deleted adapters (where `deleted_at` is not NULL)
- **AND** provides toggle controls for activation status

#### Scenario: Get adapter details for deleted adapter

- **WHEN** a user requests details of a soft-deleted adapter
- **THEN** the system returns a 404 not-found error

## ADDED Requirements

### Requirement: Adapter Deletion Validation

The system SHALL validate adapter deletion requests and prevent use of deleted adapters.

#### Scenario: Reject generation with deleted adapter

- **WHEN** a user submits a generation request with a soft-deleted adapter ID
- **THEN** the system rejects the request with a 400 error
- **AND** indicates that the adapter has been deleted

#### Scenario: Show deleted adapter indicator in job list

- **WHEN** a user views the job list containing jobs that used a now-deleted adapter
- **THEN** the adapter name column shows "Deleted Adapter" or similar indicator
- **AND** the job data remains accessible for historical reference
