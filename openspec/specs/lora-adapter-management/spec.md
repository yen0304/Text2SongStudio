# lora-adapter-management Specification

## Purpose
TBD - created by archiving change add-text2song-studio. Update Purpose after archive.
## Requirements
### Requirement: Adapter Registration

The system SHALL maintain a registry of LoRA adapters as versioned artifacts.

#### Scenario: Register new adapter

- **WHEN** a user registers a new adapter with name, version, and file path
- **THEN** the system stores the adapter metadata in the registry
- **AND** validates the adapter file is a valid PEFT checkpoint
- **AND** assigns a unique identifier

#### Scenario: Register adapter with training provenance

- **WHEN** a user registers an adapter that was trained within the system
- **THEN** the system links the adapter to its training dataset
- **AND** stores the training configuration (hyperparameters, base model version)

#### Scenario: Reject duplicate adapter version

- **WHEN** a user attempts to register an adapter with a name and version that already exists
- **THEN** the system rejects the request with a conflict error
- **AND** suggests incrementing the version number

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

### Requirement: Adapter Compatibility Validation

The system SHALL validate adapter compatibility before loading.

#### Scenario: Validate compatible adapter

- **WHEN** the system loads an adapter for generation
- **THEN** it verifies the adapter's base model matches the loaded base model
- **AND** proceeds with generation if compatible

#### Scenario: Reject incompatible adapter

- **WHEN** a user requests generation with an adapter trained on a different base model
- **THEN** the system rejects the request with a compatibility error
- **AND** suggests compatible adapters

### Requirement: Adapter Selection UI

The system SHALL provide a web interface for selecting adapters during generation.

#### Scenario: Select adapter for generation

- **WHEN** a user opens the adapter selector in the prompt editor
- **THEN** the system displays available active adapters
- **AND** shows "Base Model" as the default option
- **AND** passes the selected adapter ID to the generation request

#### Scenario: View adapter in selector

- **WHEN** a user views the adapter selector dropdown
- **THEN** each adapter shows name, version, and brief description
- **AND** indicates the currently selected adapter

### Requirement: Adapter Management UI

The system SHALL provide a web interface for browsing and managing adapters.

#### Scenario: View adapter list

- **WHEN** a user navigates to the training dashboard Adapters tab
- **THEN** the system displays all registered adapters
- **AND** shows name, version, base model, and active status for each

#### Scenario: View adapter details

- **WHEN** a user clicks on an adapter in the list
- **THEN** the system displays full adapter details including description and training configuration
- **AND** shows usage statistics if available

#### Scenario: Toggle adapter activation

- **WHEN** a user toggles the active status of an adapter
- **THEN** the system updates the adapter's active status via API
- **AND** reflects the change immediately in the UI
- **AND** active adapters appear in the generation adapter selector

#### Scenario: Filter adapters by status

- **WHEN** a user applies the "active only" filter
- **THEN** the system displays only active adapters
- **AND** maintains filter state during tab navigation

### Requirement: Version History View
The system SHALL provide adapter version history grouped by adapter name.

#### Scenario: List adapters with version grouping
- **WHEN** a user requests the adapter list with `group_by_name=true`
- **THEN** the system returns adapters grouped by base name
- **AND** versions are ordered by creation date within each group

#### Scenario: Get version timeline
- **WHEN** a user requests the version timeline for an adapter name
- **THEN** the system returns all versions with: version, loss metrics, training date, status
- **AND** includes links to the training experiment/run

### Requirement: Adapter Comparison
The system SHALL support comparing adapter versions.

#### Scenario: Compare adapter metrics
- **WHEN** a user requests comparison of two adapter versions
- **THEN** the system returns side-by-side metrics (training loss, evaluation scores)
- **AND** highlights which version is better per metric

#### Scenario: Quick A/B test from adapters
- **WHEN** a user initiates A/B test from two adapter versions
- **THEN** the system creates an A/B test pre-configured with those adapters
- **AND** navigates to the test creation page with adapters pre-selected

### Requirement: Adapter Metrics Tracking
The system SHALL track performance metrics per adapter.

#### Scenario: Record adapter usage metrics
- **WHEN** an adapter is used for generation
- **THEN** the system increments the adapter's usage count
- **AND** tracks average rating of samples generated with this adapter

#### Scenario: Get adapter performance summary
- **WHEN** a user requests adapter performance
- **THEN** the system returns: total generations, average rating, rating distribution
- **AND** compares to base model performance if available

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

### Requirement: Adapter Rename

The system SHALL allow users to rename adapters for better identification.

#### Scenario: Rename adapter via detail page

- **GIVEN** a user is viewing an adapter's detail page
- **WHEN** the user clicks on the adapter name or edit icon
- **THEN** the name field becomes editable inline
- **AND** the user can modify the name
- **AND** pressing Enter or clicking save commits the change
- **AND** pressing Escape or clicking cancel discards the change

#### Scenario: Rename adapter via list page

- **GIVEN** a user is viewing the adapters list page
- **WHEN** the user clicks the rename button on an adapter card
- **THEN** a dialog opens with the current name pre-filled
- **AND** the user can modify the name
- **AND** clicking save commits the change and closes the dialog
- **AND** clicking cancel discards the change and closes the dialog

#### Scenario: Validate adapter name

- **WHEN** a user attempts to save an adapter name
- **THEN** the system validates the name is not empty
- **AND** the system validates the name does not exceed 100 characters
- **AND** displays a validation error if constraints are violated
- **AND** prevents saving until validation passes

#### Scenario: Persist renamed adapter

- **WHEN** a user successfully renames an adapter
- **THEN** the system updates the adapter name in the database
- **AND** the new name is immediately reflected in all UI views
- **AND** the adapter's `updated_at` timestamp is updated

