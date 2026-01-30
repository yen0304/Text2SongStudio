## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Generation Job Submission

The system SHALL allow users to submit audio generation jobs for a given prompt.

#### Scenario: Submit generation with duration parameter

- **WHEN** a user submits generation with a specific duration
- **THEN** the system validates the duration against the model's maximum limit
- **AND** proceeds with generation if within limits
- **AND** rejects with clear error message if duration exceeds limit
