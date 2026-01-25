# dataset-construction Specification (Delta)

## ADDED Requirements

### Requirement: Dataset Soft Delete
The system SHALL allow users to soft delete datasets that are no longer needed.

#### Scenario: Delete dataset with no active references
- **WHEN** a user deletes a dataset by ID
- **AND** no active Adapters reference it (`training_dataset_id` with `deleted_at IS NULL`)
- **AND** no active Experiments reference it (`dataset_id` with `status != ARCHIVED`)
- **THEN** the system sets the `deleted_at` timestamp to current time
- **AND** returns HTTP 204 No Content

#### Scenario: Delete dataset blocked by active adapter
- **WHEN** a user deletes a dataset by ID
- **AND** at least one Adapter references it with `deleted_at IS NULL`
- **THEN** the system returns HTTP 400 Bad Request
- **AND** the response message indicates which adapters are blocking deletion

#### Scenario: Delete dataset blocked by active experiment
- **WHEN** a user deletes a dataset by ID
- **AND** at least one Experiment references it with `status != ARCHIVED`
- **THEN** the system returns HTTP 400 Bad Request
- **AND** the response message indicates which experiments are blocking deletion

#### Scenario: List datasets excludes deleted by default
- **WHEN** a user requests the dataset list without filters
- **THEN** the system returns only datasets where `deleted_at IS NULL`
- **AND** soft-deleted datasets are excluded from the response

#### Scenario: List datasets with deleted filter
- **WHEN** a user requests the dataset list with `include_deleted=true`
- **THEN** the system returns all datasets including soft-deleted ones
- **AND** soft-deleted datasets are visually distinguished in the response

### Requirement: Dataset Delete UI
The system SHALL provide a user interface for deleting datasets.

#### Scenario: Delete button on dataset card
- **WHEN** a user views the datasets list
- **THEN** each non-deleted dataset displays a delete option
- **AND** the option is accessible via a menu or icon button

#### Scenario: Confirmation dialog before delete
- **WHEN** a user clicks the delete option
- **THEN** the system displays a confirmation dialog
- **AND** shows the dataset name being deleted
- **AND** warns that the dataset will be hidden from the list

#### Scenario: Show blocking references on delete failure
- **WHEN** a user attempts to delete a dataset with active references
- **THEN** the system displays an error message
- **AND** lists the adapters or experiments that must be deleted/archived first

#### Scenario: Show deleted toggle
- **WHEN** a user wants to view deleted datasets
- **THEN** the system provides a toggle or filter option
- **AND** enabling it shows deleted datasets with visual distinction
