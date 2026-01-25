# audio-generation Specification Delta

## ADDED Requirements

### Requirement: Job Queue Listing
The system SHALL provide an API to list and filter generation jobs.

#### Scenario: List all jobs
- **WHEN** a user requests the job list without filters
- **THEN** the system returns jobs ordered by creation date descending
- **AND** supports pagination with limit and offset

#### Scenario: Filter jobs by status
- **WHEN** a user requests jobs with a status filter (queued, processing, completed, failed)
- **THEN** the system returns only jobs matching that status

#### Scenario: Filter jobs by adapter
- **WHEN** a user requests jobs with an adapter ID filter
- **THEN** the system returns only jobs that used that adapter

#### Scenario: Filter jobs by date range
- **WHEN** a user requests jobs with start_date and end_date parameters
- **THEN** the system returns jobs created within that range

#### Scenario: Get queue statistics
- **WHEN** a user requests queue stats
- **THEN** the system returns counts by status, average processing time, and throughput

### Requirement: A/B Test Generation
The system SHALL support batch generation for A/B testing.

#### Scenario: Generate for A/B test
- **WHEN** a user submits generation for an A/B test with two adapters
- **THEN** the system creates generation jobs for both adapters using the same prompt
- **AND** links both jobs to the A/B test record
- **AND** uses the same seed for reproducibility

#### Scenario: Track A/B generation progress
- **WHEN** an A/B test has pending generations
- **THEN** the system tracks overall progress (e.g., "4/10 pairs generated")
- **AND** marks test as ready when all pairs complete

## MODIFIED Requirements

### Requirement: Generation Job Submission
The system SHALL allow users to submit audio generation jobs for a given prompt.

#### Scenario: Submit generation with experiment tracking
- **WHEN** a user submits generation with an experiment_id parameter
- **THEN** the system links the job to the experiment
- **AND** the job appears in the experiment's generation history
