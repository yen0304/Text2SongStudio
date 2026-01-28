# lora-adapter-management Spec Delta

## ADDED Requirements

### Requirement: Training Configuration Display

The system SHALL display training configuration for adapters in an organized, informative format.

#### Scenario: View training configuration tab

- **GIVEN** a user is viewing an adapter's detail page
- **WHEN** the user clicks the "Configuration" tab
- **THEN** the system displays the training configuration grouped by category
- **AND** categories include: Model, LoRA, Training, Hardware, Checkpointing
- **AND** DPO category appears only for preference-trained adapters

#### Scenario: View hyperparameter with tooltip

- **GIVEN** a user is viewing the configuration tab
- **WHEN** the user hovers over a parameter's info icon
- **THEN** a tooltip appears explaining the parameter's purpose
- **AND** the tooltip describes typical values or ranges
- **AND** the tooltip disappears when the user moves away

#### Scenario: Display missing configuration gracefully

- **GIVEN** an adapter was not trained within the system (no training_config)
- **WHEN** a user views the configuration tab
- **THEN** the system displays a message indicating no training configuration is available
- **AND** does not show empty or broken UI elements

#### Scenario: Format configuration values appropriately

- **WHEN** the system displays training configuration values
- **THEN** numeric values use appropriate precision (e.g., 1e-4 for learning rate)
- **AND** boolean values display as "Yes" or "No"
- **AND** array values display as comma-separated list
- **AND** missing values display as "Not set"

## MODIFIED Requirements

### Requirement: Adapter Listing and Discovery

The system SHALL allow users to discover and browse available adapters, with tabs for different views.

#### Scenario: Navigate adapter detail tabs

- **GIVEN** a user is viewing an adapter's detail page
- **WHEN** the page loads
- **THEN** the system displays tabs for "Overview" and "Configuration"
- **AND** the Overview tab is selected by default
- **AND** tab content switches without full page reload
