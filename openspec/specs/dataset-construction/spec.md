# dataset-construction Specification

## Purpose
TBD - created by archiving change add-text2song-studio. Update Purpose after archive.
## Requirements
### Requirement: Dataset Creation

The system SHALL create training datasets from collected feedback data.

#### Scenario: Create supervised dataset

- **WHEN** a user requests creation of a supervised dataset with filter criteria
- **THEN** the system extracts (prompt, audio, rating) tuples matching the criteria
- **AND** creates a dataset record with metadata (sample count, filter query)

#### Scenario: Create preference dataset

- **WHEN** a user requests creation of a preference dataset
- **THEN** the system extracts (prompt, chosen_audio, rejected_audio) tuples from preference feedback
- **AND** creates a dataset record suitable for preference-based training (DPO, RLHF)

#### Scenario: Filter by rating threshold

- **WHEN** a user specifies a minimum rating threshold for dataset creation
- **THEN** the system includes only samples with ratings at or above the threshold
- **AND** records the threshold in the dataset metadata

#### Scenario: Filter by tags

- **WHEN** a user specifies required or excluded tags for dataset creation
- **THEN** the system includes only samples matching the tag criteria
- **AND** enables creation of specialized datasets (e.g., "good_rhythm" samples only)

### Requirement: Dataset Export

The system SHALL export datasets in formats suitable for training.

#### Scenario: Display training command after export

- **WHEN** a user exports a dataset via the UI
- **THEN** the system displays the CLI command to train with this dataset
- **AND** the command is copyable to clipboard

### Requirement: Dataset Quality Metrics

The system SHALL provide quality metrics for datasets.

#### Scenario: Calculate inter-rater agreement

- **WHEN** a dataset includes feedback from multiple users
- **THEN** the system calculates inter-rater agreement metrics (e.g., Krippendorff's alpha)
- **AND** reports agreement scores in dataset statistics

#### Scenario: Calculate preference consistency

- **WHEN** a preference dataset includes overlapping comparisons
- **THEN** the system identifies and reports circular preferences (A > B > C > A)
- **AND** provides a consistency score

#### Scenario: Report dataset statistics

- **WHEN** a user requests dataset statistics
- **THEN** the system returns sample count, rating distribution, prompt diversity metrics
- **AND** includes recommendations for dataset quality improvement

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

