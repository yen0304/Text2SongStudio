# audio-generation Specification Delta

## ADDED Requirements

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
