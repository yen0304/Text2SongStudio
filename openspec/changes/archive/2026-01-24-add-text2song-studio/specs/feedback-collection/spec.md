# Feedback Collection

## ADDED Requirements

### Requirement: Rating Feedback

The system SHALL collect numerical rating feedback for generated audio samples.

#### Scenario: Submit rating with single criterion

- **WHEN** a user submits a rating (1-5 scale) for an audio sample
- **THEN** the system stores the rating associated with the sample
- **AND** records the timestamp and user identifier (if available)

#### Scenario: Submit rating with multiple criteria

- **WHEN** a user submits ratings for multiple criteria (musicality, coherence, emotional alignment)
- **THEN** the system stores each criterion rating separately
- **AND** allows aggregation by criterion type

#### Scenario: Reject invalid rating value

- **WHEN** a user submits a rating outside the valid range (1-5)
- **THEN** the system rejects the request with a validation error

### Requirement: Preference Feedback

The system SHALL collect pairwise preference feedback comparing audio samples.

#### Scenario: Submit A/B preference

- **WHEN** a user indicates a preference between two audio samples (A preferred over B)
- **THEN** the system stores the preference relationship
- **AND** records which sample was preferred and which was rejected

#### Scenario: Submit preference with tie

- **WHEN** a user indicates no preference between two samples (tie)
- **THEN** the system records this as an explicit tie
- **AND** this data is available for training pipelines that support ties

#### Scenario: Submit ranking of multiple samples

- **WHEN** a user ranks multiple samples (e.g., 1st, 2nd, 3rd, 4th)
- **THEN** the system stores all pairwise preferences implied by the ranking
- **AND** each pair is stored as a separate preference record

### Requirement: Qualitative Annotations

The system SHALL collect qualitative feedback through tags and notes.

#### Scenario: Add tags to sample

- **WHEN** a user adds tags to an audio sample (e.g., ["good_rhythm", "poor_melody", "creative"])
- **THEN** the system stores the tags associated with the sample
- **AND** tags are searchable and filterable

#### Scenario: Add free-form notes

- **WHEN** a user adds a text note to an audio sample
- **THEN** the system stores the note with the feedback record
- **AND** notes are available for qualitative analysis

### Requirement: Feedback Retrieval

The system SHALL allow retrieval and filtering of feedback data.

#### Scenario: List feedback for a sample

- **WHEN** a user requests feedback for a specific audio sample
- **THEN** the system returns all ratings, preferences, and annotations for that sample

#### Scenario: Filter feedback by criteria

- **WHEN** a user requests feedback filtered by criteria (user, date range, rating threshold, tags)
- **THEN** the system returns only feedback matching the filter criteria
- **AND** supports pagination for large result sets

#### Scenario: Get aggregated feedback statistics

- **WHEN** a user requests feedback statistics for a prompt or adapter
- **THEN** the system returns aggregate metrics (average rating, preference win rate, common tags)
- **AND** includes sample counts for statistical significance assessment
