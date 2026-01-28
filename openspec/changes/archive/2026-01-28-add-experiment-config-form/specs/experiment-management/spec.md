# experiment-management Spec Delta

## ADDED Requirements

### Requirement: Experiment Configuration Form

The system SHALL provide a form interface for configuring training hyperparameters when creating experiments.

#### Scenario: Configure training parameters during experiment creation

- **GIVEN** a user is creating a new experiment
- **WHEN** the user expands the "Training Configuration" section
- **THEN** the system displays form inputs for training hyperparameters
- **AND** inputs are grouped by category (Training, LoRA, Hardware)
- **AND** each input shows a tooltip explaining the parameter

#### Scenario: Create experiment with custom config

- **WHEN** a user submits the experiment creation form with custom config values
- **THEN** the system saves the config along with name, description, and dataset
- **AND** the config appears in the experiment's Config tab

#### Scenario: Create experiment with default config

- **WHEN** a user submits the experiment creation form without modifying config
- **THEN** the system saves sensible default values for training parameters
- **AND** defaults match the values in TrainingConfig dataclass

### Requirement: Experiment Configuration Editing

The system SHALL allow users to edit training configuration on existing experiments.

#### Scenario: View config in editable form

- **GIVEN** a user views the Config tab of an experiment
- **WHEN** the page loads
- **THEN** the system displays the config in an editable form layout
- **AND** shows the same grouped structure as the creation form
- **AND** displays an "Edit" button to enable editing

#### Scenario: Edit and save config

- **GIVEN** a user is editing experiment config
- **WHEN** the user modifies parameter values and clicks "Save Changes"
- **THEN** the system updates the experiment's config via API
- **AND** displays a success notification
- **AND** exits edit mode

#### Scenario: Cancel config editing

- **GIVEN** a user is editing experiment config
- **WHEN** the user clicks "Cancel"
- **THEN** the system reverts to the original config values
- **AND** exits edit mode without saving

### Requirement: Run Configuration Override

The system SHALL allow users to override experiment config when starting a run.

#### Scenario: Start run with config override

- **GIVEN** a user is starting a new run on an experiment
- **WHEN** the user opens the start run dialog
- **THEN** the system shows the experiment's config as defaults
- **AND** provides an "Override Configuration" section
- **AND** allows modification of specific parameters

#### Scenario: Run uses override values

- **WHEN** a user starts a run with modified config values
- **THEN** the run record stores only the overridden values
- **AND** training uses the overridden values merged with experiment defaults

#### Scenario: Run uses experiment defaults

- **WHEN** a user starts a run without modifying config
- **THEN** the run record stores null or empty config
- **AND** training uses the experiment's config values

## MODIFIED Requirements

### Requirement: Experiment Detail Page Layout

The system SHALL display experiment details in a tabbed layout.

#### Scenario: Config tab displays editable form

- **WHEN** a user views the Config tab of an experiment
- **THEN** the tab displays an editable configuration form
- **AND** the form shows parameters grouped by category with tooltips
- **AND** replaces the previous raw JSON display
