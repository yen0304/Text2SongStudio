# audio-generation Specification

## Purpose
TBD - created by archiving change add-text2song-studio. Update Purpose after archive.
## Requirements
### Requirement: Generation Job Submission

The system SHALL allow users to submit audio generation jobs for a given prompt.

#### Scenario: Submit generation with duration parameter

- **WHEN** a user submits generation with a specific duration
- **THEN** the system validates the duration against the model's maximum limit
- **AND** proceeds with generation if within limits
- **AND** rejects with clear error message if duration exceeds limit

### Requirement: Generation Job Status

The system SHALL provide generation job status and progress updates.

#### Scenario: Poll job status while processing

- **WHEN** a user polls the status of a processing job
- **THEN** the system returns the current status ("queued", "processing", "completed", "failed")
- **AND** includes progress percentage if available

#### Scenario: Get completed job results

- **WHEN** a user polls the status of a completed job
- **THEN** the system returns the status "completed"
- **AND** includes a list of generated audio sample IDs

#### Scenario: Get failed job details

- **WHEN** a user polls the status of a failed job
- **THEN** the system returns the status "failed"
- **AND** includes an error message describing the failure

### Requirement: Generation Job Cancellation

The system SHALL allow users to cancel pending or processing generation jobs.

#### Scenario: Cancel queued job

- **WHEN** a user cancels a job that is queued but not yet processing
- **THEN** the system removes the job from the queue
- **AND** returns confirmation of cancellation

#### Scenario: Cancel processing job

- **WHEN** a user cancels a job that is currently processing
- **THEN** the system stops the generation process
- **AND** cleans up any partial outputs

### Requirement: Audio Storage and Retrieval

The system SHALL store generated audio files and provide streaming access.

#### Scenario: Store generated audio

- **WHEN** audio generation completes successfully
- **THEN** the system uploads the audio file to object storage
- **AND** creates an AudioSample record with metadata (duration, sample rate, storage path)

#### Scenario: Stream audio file

- **WHEN** a user requests to stream an audio file by sample ID
- **THEN** the system returns the audio data with appropriate content type
- **AND** supports HTTP range requests for seeking

#### Scenario: Get audio metadata

- **WHEN** a user requests audio metadata by sample ID
- **THEN** the system returns duration, sample rate, creation time, and generation parameters
- **AND** includes the associated prompt and adapter information

### Requirement: Audio Comparison

The system SHALL support side-by-side comparison of multiple audio samples.

#### Scenario: Compare samples from same prompt

- **WHEN** a user requests comparison of samples generated from the same prompt
- **THEN** the system returns metadata for all requested samples
- **AND** includes streaming URLs for each sample

#### Scenario: Compare samples with different adapters

- **WHEN** a user requests comparison of samples generated with different adapters
- **THEN** the system returns metadata identifying which adapter was used for each
- **AND** enables A/B evaluation of adapter performance

### Requirement: Job Feedback Aggregation

The system SHALL provide aggregated feedback information for generation jobs.

#### Scenario: View feedback summary in job status

- **WHEN** a user retrieves a completed job's status
- **THEN** the system MAY include a feedback summary (count, has_feedback flag)
- **AND** provides a link/method to retrieve full feedback details

#### Scenario: List jobs with feedback indicators

- **WHEN** a user lists generation jobs
- **THEN** each job MAY include a feedback indicator showing whether feedback exists
- **AND** this helps users identify which jobs have been reviewed

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

### Requirement: Model Registry

The system SHALL maintain a registry of supported base models with their capabilities.

#### Scenario: List available models

- **WHEN** a client requests the list of available models via `GET /models`
- **THEN** the system returns all supported models with their configurations
- **AND** includes max duration, VRAM requirements, and sample rate for each model
- **AND** indicates which model is currently active

#### Scenario: Get model configuration

- **WHEN** the system needs to validate generation parameters
- **THEN** it retrieves the model configuration from the registry
- **AND** uses the model's limits for validation

### Requirement: Generation Duration Validation

The system SHALL validate generation duration against model limits before starting generation.

#### Scenario: Duration within limits

- **WHEN** a user submits generation with duration within the model's max limit
- **THEN** the system proceeds with generation normally

#### Scenario: Duration exceeds model limit

- **WHEN** a user submits generation with duration exceeding the model's max limit
- **THEN** the system rejects the request with HTTP 400
- **AND** returns an error message specifying the requested duration and the model's limit
- **AND** does not start the generation job

#### Scenario: Duration validation with adapter

- **WHEN** a user submits generation with an adapter
- **THEN** the system validates the adapter is compatible with the current model
- **AND** rejects the request if adapter's base model doesn't match loaded model
- **AND** applies the current model's duration limits for validation

#### Scenario: Reject incompatible adapter

- **WHEN** a user submits generation with an adapter trained on a different base model
- **THEN** the system rejects the request with HTTP 400
- **AND** returns an error message: "Adapter requires [Adapter's Model] but current model is [Current Model]"
- **AND** does not start the generation job

