# lora-adapter-management Spec Delta

## ADDED Requirements

### Requirement: Adapter Rename

The system SHALL allow users to rename adapters for better identification.

#### Scenario: Rename adapter via detail page

- **GIVEN** a user is viewing an adapter's detail page
- **WHEN** the user clicks on the adapter name or edit icon
- **THEN** the name field becomes editable inline
- **AND** the user can modify the name
- **AND** pressing Enter or clicking save commits the change
- **AND** pressing Escape or clicking cancel discards the change

#### Scenario: Rename adapter via list page

- **GIVEN** a user is viewing the adapters list page
- **WHEN** the user clicks the rename button on an adapter card
- **THEN** a dialog opens with the current name pre-filled
- **AND** the user can modify the name
- **AND** clicking save commits the change and closes the dialog
- **AND** clicking cancel discards the change and closes the dialog

#### Scenario: Validate adapter name

- **WHEN** a user attempts to save an adapter name
- **THEN** the system validates the name is not empty
- **AND** the system validates the name does not exceed 100 characters
- **AND** displays a validation error if constraints are violated
- **AND** prevents saving until validation passes

#### Scenario: Persist renamed adapter

- **WHEN** a user successfully renames an adapter
- **THEN** the system updates the adapter name in the database
- **AND** the new name is immediately reflected in all UI views
- **AND** the adapter's `updated_at` timestamp is updated
