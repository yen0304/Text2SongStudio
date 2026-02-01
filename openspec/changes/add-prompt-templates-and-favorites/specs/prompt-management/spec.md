# prompt-management Spec Delta

## ADDED Requirements

### Requirement: Prompt Templates

The system SHALL provide reusable prompt templates for quick prompt creation.

#### Scenario: List system templates

- **WHEN** a user requests the template list
- **THEN** the system returns all system templates grouped by category
- **AND** system templates are marked with `is_system: true`
- **AND** system templates cannot be modified or deleted by users

#### Scenario: List user templates

- **WHEN** a user requests their custom templates
- **THEN** the system returns templates created by that user
- **AND** templates include name, description, text, and attributes

#### Scenario: Create user template

- **WHEN** a user creates a new template with name, text, and optional attributes
- **THEN** the system validates the template name is unique for that user
- **AND** the system stores the template with `is_system: false`
- **AND** the template is immediately available for selection

#### Scenario: Apply template to prompt editor

- **WHEN** a user selects a template in the prompt editor
- **THEN** the system populates the prompt text field with the template text
- **AND** the system populates attribute fields (style, mood, tempo, instruments) with template values
- **AND** the user can modify the populated values before generation

#### Scenario: Save current prompt as template

- **WHEN** a user clicks "Save as Template" with a filled prompt
- **THEN** the system prompts for a template name and optional description
- **AND** the system creates a new user template with the current prompt values

#### Scenario: Delete user template

- **WHEN** a user deletes their own template
- **THEN** the system removes the template from their list
- **AND** existing prompts created from this template are not affected

#### Scenario: Filter templates by category

- **WHEN** a user filters templates by category (e.g., "electronic", "classical")
- **THEN** the system returns only templates matching that category
- **AND** both system and user templates are included in filtered results

### Requirement: Prompt History Search

The system SHALL allow users to search their prompt history using text and attribute filters.

#### Scenario: Search prompts by text

- **WHEN** a user enters a search query (e.g., "piano jazz")
- **THEN** the system performs full-text search on prompt text
- **AND** returns prompts containing any of the search terms
- **AND** results are ranked by relevance

#### Scenario: Search prompts by style attribute

- **WHEN** a user filters prompts by style (e.g., "electronic")
- **THEN** the system returns prompts with matching style attribute
- **AND** results can be combined with text search

#### Scenario: Search prompts by mood attribute

- **WHEN** a user filters prompts by mood (e.g., "melancholic")
- **THEN** the system returns prompts with matching mood attribute
- **AND** results can be combined with other filters

#### Scenario: Search prompts by tempo range

- **WHEN** a user specifies a tempo range (e.g., 100-140 BPM)
- **THEN** the system returns prompts with tempo within that range
- **AND** prompts without tempo attribute are excluded from tempo-filtered results

#### Scenario: Search prompts by date range

- **WHEN** a user specifies a date range
- **THEN** the system returns prompts created within that period
- **AND** results respect pagination settings

#### Scenario: Empty search results

- **WHEN** a search query matches no prompts
- **THEN** the system returns an empty list with total count of zero
- **AND** suggests broadening search criteria

### Requirement: Prompt Favorites

The system SHALL allow users to bookmark prompts for quick access.

#### Scenario: Add prompt to favorites

- **WHEN** a user clicks the favorite button on a prompt
- **THEN** the system adds the prompt to the user's favorites list
- **AND** the favorite button shows filled/active state

#### Scenario: Remove prompt from favorites

- **WHEN** a user clicks the favorite button on an already-favorited prompt
- **THEN** the system removes the prompt from favorites
- **AND** the favorite button shows unfilled/inactive state

#### Scenario: List favorite prompts

- **WHEN** a user views their favorites page
- **THEN** the system displays all favorited prompts
- **AND** prompts are ordered by favorite creation date (most recent first)
- **AND** each entry shows prompt preview and favorite timestamp

#### Scenario: Add note to favorite

- **WHEN** a user adds a note to a favorited prompt
- **THEN** the system stores the note with the favorite
- **AND** the note is displayed alongside the favorite entry

#### Scenario: Favorite prompt deletion handling

- **WHEN** a favorited prompt is deleted
- **THEN** the system removes the corresponding favorite entry
- **AND** no orphaned favorites remain in the database
