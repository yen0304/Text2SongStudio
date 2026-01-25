## MODIFIED Requirements

### Requirement: Structured Musical Attributes

The system SHALL support structured musical attributes for fine-grained control.

#### Scenario: Specify style attribute

- **WHEN** a user specifies a style attribute (e.g., "electronic", "classical", "jazz")
- **THEN** the system includes this in the generation context
- **AND** the generated audio reflects the specified style

#### Scenario: Specify tempo attribute

- **WHEN** a user specifies a tempo (BPM value between 40 and 200)
- **THEN** the system includes this in the generation context
- **AND** validates the tempo is within acceptable range

#### Scenario: Specify primary instruments via checkbox selection

- **WHEN** a user selects one or more primary instruments from the categorized checkbox UI
- **THEN** the system validates the selected instruments against the allowed instruments list
- **AND** the system builds a prompt with "featuring [primary instruments]"
- **AND** the generated audio prominently features the specified instruments

#### Scenario: Specify secondary instruments via checkbox selection

- **WHEN** a user selects one or more secondary instruments from the categorized checkbox UI
- **THEN** the system validates the selected instruments against the allowed instruments list
- **AND** the system builds a prompt with "with subtle [secondary instruments]"
- **AND** the generated audio includes the specified instruments as supporting elements

#### Scenario: Reject invalid instrumentation via API

- **WHEN** an API request contains an instrument not in the allowed list
- **THEN** the system rejects the request with a validation error
- **AND** the error message indicates which instruments are invalid

#### Scenario: Specify mood attribute

- **WHEN** a user specifies a mood (e.g., "energetic", "melancholic", "peaceful")
- **THEN** the system includes this in the generation context
- **AND** the generated audio evokes the specified mood

## ADDED Requirements

### Requirement: Categorized Instrument Selection

The system SHALL provide a categorized list of supported instruments for organized selection.

#### Scenario: Display instrument categories

- **WHEN** a user views the instrument selection UI
- **THEN** the system displays instruments grouped into categories: Keys, Strings, Drums & Percussion, Brass & Woodwind, Synths & Electronic, World / Ethnic, Texture / FX
- **AND** each category can be expanded or collapsed independently

#### Scenario: Select instruments with primary/secondary distinction

- **WHEN** a user selects an instrument
- **THEN** the user can mark it as primary (main) or secondary (supporting)
- **AND** selecting as primary removes it from secondary (and vice versa)
- **AND** the UI clearly indicates which instruments are selected and their role
