## MODIFIED Requirements

### Requirement: Adapter Listing and Discovery

The system SHALL allow users to discover and browse available adapters, with model capability information.

#### Scenario: List adapters with model info

- **WHEN** a user requests the adapter list
- **THEN** the system returns adapters with their base model information
- **AND** includes model capabilities (max duration, display name) for each adapter
- **AND** enables the UI to filter and show appropriate generation limits

#### Scenario: View adapter details with model capabilities

- **WHEN** a user views adapter details
- **THEN** the system displays the adapter's base model
- **AND** shows the model's generation limits and capabilities
- **AND** indicates compatibility with currently loaded model

### Requirement: Adapter Selection UI

The system SHALL provide a web interface for selecting adapters during generation with compatibility filtering.

#### Scenario: Filter adapters by compatibility

- **WHEN** a user opens the adapter selector in the prompt editor
- **THEN** the UI shows compatible adapters (matching current model) as selectable
- **AND** shows incompatible adapters as disabled with hint "Requires [Model Name]"
- **AND** displays a message explaining that some adapters require a different model

#### Scenario: Select compatible adapter

- **WHEN** a user selects a compatible adapter
- **THEN** the system uses the adapter for generation
- **AND** duration limits remain based on the current model configuration

#### Scenario: Attempt to select incompatible adapter

- **WHEN** a user attempts to select a disabled (incompatible) adapter
- **THEN** the UI prevents selection
- **AND** shows a tooltip or message: "This adapter requires [Model Name]. Change model in Settings."

#### Scenario: No compatible adapters available

- **WHEN** no adapters are compatible with the current model
- **THEN** the UI shows "None (base model)" as the only option
- **AND** displays a hint: "No adapters available for [Current Model]. Train or import adapters, or change model in Settings."
