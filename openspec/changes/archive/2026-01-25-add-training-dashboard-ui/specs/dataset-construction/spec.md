# dataset-construction Spec Delta

## ADDED Requirements

### Requirement: Dataset Management UI

The system SHALL provide a web interface for managing training datasets.

#### Scenario: View dataset list

- **WHEN** a user navigates to the training dashboard Datasets tab
- **THEN** the system displays all datasets with name, type, sample count, and creation date
- **AND** indicates export status for each dataset

#### Scenario: Create dataset via UI

- **WHEN** a user fills out the dataset creation form with name, type, and filter criteria
- **THEN** the system shows a preview of matching sample count
- **AND** creates the dataset when the user confirms
- **AND** displays the new dataset in the list

#### Scenario: Export dataset via UI

- **WHEN** a user initiates export for a dataset
- **THEN** the system shows export format options (JSONL, Hugging Face)
- **AND** displays the export path after completion
- **AND** shows the CLI training command for the exported dataset

#### Scenario: View empty state

- **WHEN** a user views the Datasets tab with no datasets created
- **THEN** the system displays a helpful message explaining how to create a dataset
- **AND** provides a button to open the creation form

## MODIFIED Requirements

### Requirement: Dataset Export

The system SHALL export datasets in formats suitable for training.

#### Scenario: Display training command after export

- **WHEN** a user exports a dataset via the UI
- **THEN** the system displays the CLI command to train with this dataset
- **AND** the command is copyable to clipboard
