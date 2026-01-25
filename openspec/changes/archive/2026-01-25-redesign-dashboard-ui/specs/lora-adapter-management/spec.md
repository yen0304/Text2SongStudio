# lora-adapter-management Specification Delta

## ADDED Requirements

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
