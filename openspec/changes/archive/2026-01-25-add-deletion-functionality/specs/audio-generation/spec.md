## ADDED Requirements

### Requirement: Job Deletion

The system SHALL allow users to delete generation jobs with proper cascade handling.

#### Scenario: Delete a completed job

- **WHEN** a user requests deletion of a completed generation job
- **THEN** the system soft-deletes the job by setting `deleted_at` timestamp
- **AND** hard-deletes all feedback records associated with the job's audio samples
- **AND** returns confirmation of deletion

#### Scenario: Delete a queued job

- **WHEN** a user requests deletion of a queued job
- **THEN** the system cancels the job if still pending
- **AND** soft-deletes the job
- **AND** returns confirmation of deletion

#### Scenario: Delete a processing job

- **WHEN** a user requests deletion of a currently processing job
- **THEN** the system cancels the ongoing generation
- **AND** soft-deletes the job
- **AND** cleans up any partial outputs
- **AND** returns confirmation of deletion

#### Scenario: Attempt to delete non-existent job

- **WHEN** a user requests deletion of a job that does not exist
- **THEN** the system returns a 404 not-found error

#### Scenario: List jobs excludes deleted

- **WHEN** a user requests the job list
- **THEN** the system returns only jobs where `deleted_at` is NULL
- **AND** soft-deleted jobs are not included in results

#### Scenario: Get deleted job returns 404

- **WHEN** a user requests details of a soft-deleted job
- **THEN** the system returns a 404 not-found error

## MODIFIED Requirements

### Requirement: Job Queue Listing

The system SHALL provide an API to list and filter generation jobs.

#### Scenario: List all jobs

- **WHEN** a user requests the job list without filters
- **THEN** the system returns jobs ordered by creation date descending
- **AND** excludes soft-deleted jobs (where `deleted_at` is not NULL)
- **AND** supports pagination with limit and offset

#### Scenario: Filter jobs by status

- **WHEN** a user requests jobs with a status filter (queued, processing, completed, failed)
- **THEN** the system returns only jobs matching that status
- **AND** excludes soft-deleted jobs

#### Scenario: Filter jobs by adapter

- **WHEN** a user requests jobs with an adapter ID filter
- **THEN** the system returns only jobs that used that adapter
- **AND** excludes soft-deleted jobs

#### Scenario: Filter jobs by date range

- **WHEN** a user requests jobs with start_date and end_date parameters
- **THEN** the system returns jobs created within that range
- **AND** excludes soft-deleted jobs

#### Scenario: Get queue statistics

- **WHEN** a user requests queue stats
- **THEN** the system returns counts by status, average processing time, and throughput
- **AND** excludes soft-deleted jobs from all statistics
