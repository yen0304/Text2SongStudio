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

#### Scenario: Export supervised dataset

- **WHEN** a user requests export of a supervised dataset
- **THEN** the system generates a manifest file mapping prompts to audio file paths
- **AND** includes rating labels for each sample
- **AND** provides download links for all audio files

#### Scenario: Export preference dataset

- **WHEN** a user requests export of a preference dataset
- **THEN** the system generates a manifest with (prompt, chosen_path, rejected_path) tuples
- **AND** formats the data for compatibility with DPO training scripts

#### Scenario: Export to Hugging Face format

- **WHEN** a user requests export in Hugging Face Dataset format
- **THEN** the system generates a dataset compatible with `datasets.load_from_disk()`
- **AND** includes all metadata as dataset features

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

