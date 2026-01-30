# training-pipeline Spec Delta

This file contains specification changes for the `training-pipeline` capability.

## ADDED Requirements

### Requirement: Structured Metric Capture

The system SHALL extract and store structured metrics from training log output for visualization purposes.

#### Scenario: Store structured metrics during training

- **WHEN** training logs are captured from subprocess output
- **THEN** the system parses log lines to extract numerical metrics using regex patterns
- **AND** stores extracted metrics in `ExperimentRun.metrics` JSON field as time-series data
- **AND** metrics include at minimum: step number, loss value, and timestamp
- **AND** parsing failures are logged but do not interrupt log capture or existing log streaming
- **AND** existing log streaming functionality remains unchanged

#### Scenario: Retrieve metrics via API

- **WHEN** a user requests training metrics for a specific run via new API endpoint
- **THEN** the system returns structured metric data grouped by type (loss, learning_rate, grad_norm)
- **AND** each metric includes step, value, and timestamp
- **AND** the response indicates whether the run is complete or still in progress
- **AND** existing log retrieval endpoints remain unchanged

### Requirement: Metric Visualization Support

The system SHALL support structured metric retrieval for visualization purposes.

#### Scenario: Query metrics by type

- **WHEN** a user requests specific metric types (e.g., only loss)
- **THEN** the system returns only the requested metric type
- **AND** response time is optimized by filtering at the database level

#### Scenario: Query metrics by step range

- **WHEN** a user requests metrics within a specific step range
- **THEN** the system returns only metrics where step is within the specified range
- **AND** this enables efficient loading of large training runs with 1000+ data points

#### Scenario: Handle runs without metrics

- **WHEN** a user requests metrics for a run that predates metric capture
- **THEN** the system returns an empty metrics object with appropriate metadata
- **AND** the response indicates no metrics are available for this run
- **AND** the frontend displays a fallback message explaining metrics are not available

#### Scenario: Batch metric updates during training

- **WHEN** multiple log lines are processed in a short time window
- **THEN** the system batches metric updates to the database
- **AND** updates occur at most every 5-10 log chunks to reduce database load
- **AND** batch updates do not cause noticeable delay in log streaming to the frontend
