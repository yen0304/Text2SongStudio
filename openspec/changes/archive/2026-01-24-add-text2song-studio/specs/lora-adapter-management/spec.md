# LoRA Adapter Management

## ADDED Requirements

### Requirement: Adapter Registration

The system SHALL maintain a registry of LoRA adapters as versioned artifacts.

#### Scenario: Register new adapter

- **WHEN** a user registers a new adapter with name, version, and file path
- **THEN** the system stores the adapter metadata in the registry
- **AND** validates the adapter file is a valid PEFT checkpoint
- **AND** assigns a unique identifier

#### Scenario: Register adapter with training provenance

- **WHEN** a user registers an adapter that was trained within the system
- **THEN** the system links the adapter to its training dataset
- **AND** stores the training configuration (hyperparameters, base model version)

#### Scenario: Reject duplicate adapter version

- **WHEN** a user attempts to register an adapter with a name and version that already exists
- **THEN** the system rejects the request with a conflict error
- **AND** suggests incrementing the version number

### Requirement: Adapter Listing and Discovery

The system SHALL allow users to discover and browse available adapters.

#### Scenario: List all adapters

- **WHEN** a user requests a list of adapters
- **THEN** the system returns all registered adapters with metadata
- **AND** indicates which adapters are currently active

#### Scenario: Filter adapters by base model

- **WHEN** a user filters adapters by base model compatibility
- **THEN** the system returns only adapters compatible with the specified base model

#### Scenario: Get adapter details

- **WHEN** a user requests details for a specific adapter
- **THEN** the system returns full metadata including description, training info, and usage statistics
- **AND** includes feedback statistics for samples generated with this adapter

### Requirement: Adapter Lifecycle Management

The system SHALL support adapter activation, deactivation, and versioning.

#### Scenario: Activate adapter

- **WHEN** a user activates an adapter
- **THEN** the adapter becomes available for selection in generation requests
- **AND** the system pre-loads the adapter if resources permit

#### Scenario: Deactivate adapter

- **WHEN** a user deactivates an adapter
- **THEN** the adapter is no longer available for new generation requests
- **AND** existing jobs using the adapter continue to completion

#### Scenario: Compare adapter versions

- **WHEN** a user requests comparison between adapter versions
- **THEN** the system returns metrics for each version (average rating, preference win rate)
- **AND** identifies statistically significant differences

### Requirement: Adapter Compatibility Validation

The system SHALL validate adapter compatibility before loading.

#### Scenario: Validate compatible adapter

- **WHEN** the system loads an adapter for generation
- **THEN** it verifies the adapter's base model matches the loaded base model
- **AND** proceeds with generation if compatible

#### Scenario: Reject incompatible adapter

- **WHEN** a user requests generation with an adapter trained on a different base model
- **THEN** the system rejects the request with a compatibility error
- **AND** suggests compatible adapters
