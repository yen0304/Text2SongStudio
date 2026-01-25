# dashboard-layout Specification

## Purpose
TBD - created by archiving change redesign-dashboard-ui. Update Purpose after archive.
## Requirements
### Requirement: Sidebar Navigation
The system SHALL provide sidebar-based navigation for all major features.

#### Scenario: Display navigation items
- **WHEN** a user views any page
- **THEN** the sidebar displays navigation items: Overview, Generate, Jobs, Experiments, Adapters, Datasets, Settings
- **AND** the current page's item is visually highlighted

#### Scenario: Navigate between sections
- **WHEN** a user clicks a navigation item
- **THEN** the system navigates to the corresponding page without full reload
- **AND** the URL updates to reflect the new location

#### Scenario: Collapse sidebar on mobile
- **WHEN** a user views the app on a screen < 768px
- **THEN** the sidebar collapses to icons only
- **AND** a hamburger menu expands to show full labels

#### Scenario: Keyboard navigation
- **WHEN** a user presses `g` followed by a shortcut key (o, j, e, a, d, s)
- **THEN** the system navigates to the corresponding section
- **AND** no text input fields are focused

### Requirement: Status Bar
The system SHALL display a status bar with real-time system metrics.

#### Scenario: Show active job count
- **WHEN** the dashboard loads
- **THEN** the status bar shows the count of jobs in "queued" or "processing" status
- **AND** updates every 30 seconds

#### Scenario: Show pending feedback count
- **WHEN** the dashboard loads
- **THEN** the status bar shows the count of audio samples without feedback
- **AND** clicking navigates to the jobs page filtered to samples needing feedback

### Requirement: Pipeline Overview
The system SHALL display a visual pipeline showing workflow stages.

#### Scenario: Display pipeline stages
- **WHEN** a user views the overview page
- **THEN** the system displays four connected stages: Generate → Feedback → Dataset → Training
- **AND** each stage shows the count of items in that stage

#### Scenario: Navigate from pipeline stage
- **WHEN** a user clicks a pipeline stage
- **THEN** the system navigates to the relevant page (Jobs, Jobs filtered, Datasets, Experiments)

#### Scenario: Highlight active stage
- **WHEN** there are items actively processing in a stage
- **THEN** that stage displays a visual indicator (animation or badge)

### Requirement: Page Header
The system SHALL provide consistent page headers with actions.

#### Scenario: Display page title
- **WHEN** a user views any page
- **THEN** the page header shows the page title and breadcrumb if applicable

#### Scenario: Display page actions
- **WHEN** a page has primary actions (e.g., "Create Experiment")
- **THEN** the actions appear in the page header right-aligned

### Requirement: Job Queue View
The system SHALL provide a centralized view of all generation jobs.

#### Scenario: List all jobs
- **WHEN** a user views the jobs page
- **THEN** the system displays a table of jobs with: ID, prompt preview, status, progress, adapter, duration
- **AND** orders by creation date descending

#### Scenario: Filter jobs by status
- **WHEN** a user selects a status filter
- **THEN** the list shows only jobs matching that status
- **AND** the URL updates to preserve the filter

#### Scenario: Real-time job updates
- **WHEN** a job's status changes
- **THEN** the job list updates within 5 seconds without user action

#### Scenario: View job detail
- **WHEN** a user clicks a job row
- **THEN** the system navigates to the job detail page
- **AND** shows full configuration, audio samples, and feedback panel

### Requirement: A/B Testing View
The system SHALL support side-by-side adapter comparison.

#### Scenario: Create A/B test
- **WHEN** a user creates an A/B test with two adapters and test prompts
- **THEN** the system creates the test record
- **AND** queues generation jobs for both adapters on each prompt

#### Scenario: Display comparison player
- **WHEN** a user views an A/B test
- **THEN** the system displays two audio players side by side
- **AND** provides preference buttons (Prefer A, Prefer B, Equal)

#### Scenario: Submit preference vote
- **WHEN** a user selects a preference
- **THEN** the system records the vote
- **AND** advances to the next prompt pair

#### Scenario: Show test results
- **WHEN** all prompts have been evaluated
- **THEN** the system displays aggregate results
- **AND** shows statistical significance if sample size is sufficient

#### Scenario: Blind mode
- **WHEN** a user enables blind mode
- **THEN** the adapter labels are hidden (shown as "Sample 1" / "Sample 2")
- **AND** the mapping is randomized per prompt

### Requirement: Adapter Version History
The system SHALL display adapter versions in a timeline format.

#### Scenario: Group adapters by name
- **WHEN** a user views the adapters page
- **THEN** adapters are grouped by base name (e.g., "ambient-style")
- **AND** versions are displayed chronologically within each group

#### Scenario: Highlight active version
- **WHEN** an adapter version is marked as active
- **THEN** it displays a distinct visual indicator
- **AND** appears at the top of its version group

#### Scenario: Compare adapter versions
- **WHEN** a user selects two versions of the same adapter
- **THEN** the system navigates to an A/B test setup pre-populated with those adapters

