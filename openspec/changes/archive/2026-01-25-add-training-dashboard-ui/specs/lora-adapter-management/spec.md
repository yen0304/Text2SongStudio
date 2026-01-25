# lora-adapter-management Spec Delta

## ADDED Requirements

### Requirement: Adapter Selection UI

The system SHALL provide a web interface for selecting adapters during generation.

#### Scenario: Select adapter for generation

- **WHEN** a user opens the adapter selector in the prompt editor
- **THEN** the system displays available active adapters
- **AND** shows "Base Model" as the default option
- **AND** passes the selected adapter ID to the generation request

#### Scenario: View adapter in selector

- **WHEN** a user views the adapter selector dropdown
- **THEN** each adapter shows name, version, and brief description
- **AND** indicates the currently selected adapter

### Requirement: Adapter Management UI

The system SHALL provide a web interface for browsing and managing adapters.

#### Scenario: View adapter list

- **WHEN** a user navigates to the training dashboard Adapters tab
- **THEN** the system displays all registered adapters
- **AND** shows name, version, base model, and active status for each

#### Scenario: View adapter details

- **WHEN** a user clicks on an adapter in the list
- **THEN** the system displays full adapter details including description and training configuration
- **AND** shows usage statistics if available

#### Scenario: Toggle adapter activation

- **WHEN** a user toggles the active status of an adapter
- **THEN** the system updates the adapter's active status via API
- **AND** reflects the change immediately in the UI
- **AND** active adapters appear in the generation adapter selector

#### Scenario: Filter adapters by status

- **WHEN** a user applies the "active only" filter
- **THEN** the system displays only active adapters
- **AND** maintains filter state during tab navigation

## MODIFIED Requirements

### Requirement: Adapter Listing and Discovery

The system SHALL allow users to discover and browse available adapters.

#### Scenario: List adapters with activation status

- **WHEN** a user requests a list of adapters via UI
- **THEN** the system clearly indicates which adapters are currently active
- **AND** provides toggle controls for activation status
