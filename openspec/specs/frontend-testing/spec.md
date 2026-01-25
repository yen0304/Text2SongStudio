# frontend-testing Specification

## Purpose
TBD - created by archiving change add-frontend-testing. Update Purpose after archive.
## Requirements
### Requirement: Test Infrastructure
The system SHALL provide a complete testing infrastructure for front-end code.

#### Scenario: Run all tests
- **WHEN** a developer executes `npm test`
- **THEN** Vitest runs all test files matching `*.test.{ts,tsx}`
- **AND** reports pass/fail status for each test

#### Scenario: Run tests in CI mode
- **WHEN** a developer executes `npm run test:run`
- **THEN** Vitest runs all tests once without watch mode
- **AND** exits with code 0 on success, non-zero on failure

#### Scenario: Generate coverage report
- **WHEN** a developer executes `npm run test:coverage`
- **THEN** Vitest generates a coverage report in text, HTML, and LCOV formats
- **AND** the report shows statement, branch, function, and line coverage

#### Scenario: Path alias resolution
- **WHEN** a test file imports using `@/` path alias
- **THEN** the import resolves correctly to `src/` directory
- **AND** TypeScript provides proper type checking

### Requirement: Test Utilities
The system SHALL provide shared utilities for testing React components.

#### Scenario: Custom render with providers
- **WHEN** a test uses the custom render function from `test-utils`
- **THEN** components are wrapped with necessary context providers
- **AND** testing-library queries are returned

#### Scenario: API mock factory
- **WHEN** a test imports the API mock from `__mocks__/api`
- **THEN** all API methods are available as mock functions
- **AND** mocks can be configured with custom return values

#### Scenario: Next.js navigation mocks
- **WHEN** a test renders a component using `next/navigation`
- **THEN** `useRouter`, `usePathname`, and `useSearchParams` are mocked
- **AND** navigation actions can be verified

### Requirement: Utility Function Tests
The system SHALL have tests for utility functions achieving 100% coverage.

#### Scenario: Test cn utility
- **GIVEN** the `cn` function from `lib/utils`
- **WHEN** called with multiple class names
- **THEN** returns merged Tailwind classes with conflicts resolved

### Requirement: Hook Tests
The system SHALL have tests for custom hooks achieving 80% coverage.

#### Scenario: Test useAdapters loading state
- **GIVEN** the `useAdapters` hook
- **WHEN** mounted
- **THEN** initially returns `isLoading: true`
- **AND** eventually returns `isLoading: false` with adapter data

#### Scenario: Test useAdapters error handling
- **GIVEN** the `useAdapters` hook
- **WHEN** the API call fails
- **THEN** returns `error` with the error message
- **AND** `adapters` is an empty array

#### Scenario: Test useDatasets data fetching
- **GIVEN** the `useDatasets` hook
- **WHEN** mounted with default parameters
- **THEN** fetches datasets from the API
- **AND** returns datasets array and total count

### Requirement: UI Component Tests
The system SHALL have tests for UI components achieving 70% coverage.

#### Scenario: Test Button click handler
- **GIVEN** a Button component with onClick prop
- **WHEN** a user clicks the button
- **THEN** the onClick handler is called

#### Scenario: Test Button variants
- **GIVEN** a Button component
- **WHEN** rendered with different `variant` props
- **THEN** applies the correct CSS classes for each variant

#### Scenario: Test Card composition
- **GIVEN** Card, CardHeader, CardTitle, CardContent components
- **WHEN** composed together
- **THEN** renders a properly structured card layout

#### Scenario: Test Input value changes
- **GIVEN** an Input component
- **WHEN** a user types into the input
- **THEN** the onChange handler is called with the new value

#### Scenario: Test ErrorBoundary error catching
- **GIVEN** an ErrorBoundary wrapping a component that throws
- **WHEN** the child component throws an error
- **THEN** the ErrorBoundary catches it and displays fallback UI

### Requirement: Feature Component Tests
The system SHALL have tests for feature components achieving 50% coverage.

#### Scenario: Test FeedbackPanel rating submission
- **GIVEN** a FeedbackPanel with audio IDs
- **WHEN** a user selects a rating and clicks submit
- **THEN** the API is called with the rating
- **AND** the onFeedbackSubmitted callback is invoked

#### Scenario: Test FeedbackPanel tag management
- **GIVEN** a FeedbackPanel with audio IDs
- **WHEN** a user adds a tag from suggestions
- **THEN** the tag appears in the selected tags list
- **WHEN** a user removes a tag
- **THEN** the tag is removed from the list

#### Scenario: Test Sidebar navigation links
- **GIVEN** a Sidebar component
- **WHEN** rendered
- **THEN** displays all navigation items
- **AND** highlights the current active route

### Requirement: Coverage Threshold
The system SHALL enforce a minimum 50% code coverage threshold.

#### Scenario: Fail on insufficient coverage
- **WHEN** a developer runs `npm run test:coverage`
- **AND** overall coverage is below 50%
- **THEN** the command exits with non-zero status

#### Scenario: Pass on sufficient coverage
- **WHEN** a developer runs `npm run test:coverage`
- **AND** overall coverage is at or above 50%
- **THEN** the command exits with status 0

