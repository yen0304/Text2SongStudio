# backend-testing Specification

## Purpose
TBD - created by archiving change add-backend-testing. Update Purpose after archive.
## Requirements
### Requirement: Test Infrastructure
The system SHALL provide a complete testing infrastructure for backend code.

#### Scenario: Run all tests
- **WHEN** a developer executes `pytest`
- **THEN** pytest runs all test files matching `test_*.py`
- **AND** reports pass/fail status for each test

#### Scenario: Run tests with coverage
- **WHEN** a developer executes `pytest --cov=app`
- **THEN** pytest generates a coverage report
- **AND** the report shows statement, branch, function, and line coverage

#### Scenario: Coverage threshold enforcement
- **WHEN** a developer executes `pytest --cov=app --cov-fail-under=50`
- **AND** overall coverage is below 50%
- **THEN** the command exits with non-zero status

#### Scenario: Pass on sufficient coverage
- **WHEN** a developer executes `pytest --cov=app --cov-fail-under=50`
- **AND** overall coverage is at or above 50%
- **THEN** the command exits with status 0

### Requirement: Test Directory Structure
The system SHALL organize tests in a structured directory hierarchy mirroring the application structure.

#### Scenario: Schema tests location
- **GIVEN** a test for `app/schemas/prompt.py`
- **WHEN** looking for the test file
- **THEN** it is located at `tests/schemas/test_prompt.py`

#### Scenario: Router tests location
- **GIVEN** a test for `app/routers/prompts.py`
- **WHEN** looking for the test file
- **THEN** it is located at `tests/routers/test_prompts.py`

#### Scenario: Service tests location
- **GIVEN** a test for `app/services/storage.py`
- **WHEN** looking for the test file
- **THEN** it is located at `tests/services/test_storage.py`

### Requirement: Test Fixtures
The system SHALL provide shared fixtures for testing backend components.

#### Scenario: Test client fixture
- **WHEN** a test uses the `client` fixture from conftest
- **THEN** a FastAPI TestClient is provided
- **AND** the client can make HTTP requests to the app

#### Scenario: Mock database fixture
- **WHEN** a test uses the `mock_db` fixture
- **THEN** an AsyncSession mock is provided
- **AND** database operations can be stubbed with custom return values

#### Scenario: Mock storage fixture
- **WHEN** a test uses the `mock_storage` fixture
- **THEN** a StorageService mock is provided
- **AND** S3 operations can be stubbed without actual S3 calls

### Requirement: Schema Validation Tests
The system SHALL have tests for Pydantic schema validation logic.

#### Scenario: Test PromptAttributes instrument validation
- **GIVEN** the PromptAttributes schema
- **WHEN** created with invalid instrument names
- **THEN** raises ValidationError with appropriate message

#### Scenario: Test PromptAttributes tempo validation
- **GIVEN** the PromptAttributes schema
- **WHEN** created with tempo outside 40-200 range
- **THEN** raises ValidationError

#### Scenario: Test FeedbackCreate validation
- **GIVEN** the FeedbackCreate schema
- **WHEN** created without rating, preference, or tags
- **THEN** raises ValidationError requiring at least one feedback type

#### Scenario: Test GenerationRequest validation
- **GIVEN** the GenerationRequest schema
- **WHEN** created with num_samples outside 1-4 range
- **THEN** raises ValidationError

### Requirement: Router Endpoint Tests
The system SHALL have tests for API endpoints using mocked database.

#### Scenario: Test prompts CRUD
- **GIVEN** the prompts router with mocked database
- **WHEN** POST, GET, LIST endpoints are called
- **THEN** correct HTTP status codes are returned
- **AND** response schemas are validated

#### Scenario: Test feedback submission
- **GIVEN** the feedback router with mocked database
- **WHEN** POST /feedback is called with valid data
- **THEN** returns 201 status with FeedbackResponse

#### Scenario: Test adapter listing
- **GIVEN** the adapters router with mocked database
- **WHEN** GET /adapters is called
- **THEN** returns paginated AdapterListResponse

#### Scenario: Test 404 handling
- **GIVEN** any router with mocked database returning None
- **WHEN** GET with non-existent ID is called
- **THEN** returns 404 status with error detail

### Requirement: Service Tests
The system SHALL have tests for service layer business logic.

#### Scenario: Test StorageService upload
- **GIVEN** StorageService with mocked boto3 client
- **WHEN** upload_file is called
- **THEN** put_object is called with correct parameters
- **AND** returns S3 URI

#### Scenario: Test StorageService key parsing
- **GIVEN** StorageService with mocked boto3 client
- **WHEN** stream_file is called with full S3 URI
- **THEN** extracts key correctly and retrieves file

#### Scenario: Test DatasetService filter building
- **GIVEN** DatasetService with mocked database
- **WHEN** count_samples is called with filter_query
- **THEN** correct SQLAlchemy conditions are built

### Requirement: Config Tests
The system SHALL have tests for application configuration.

#### Scenario: Test database URL conversion
- **GIVEN** Settings with postgresql:// URL
- **WHEN** database_url is accessed
- **THEN** returns postgresql+asyncpg:// URL

#### Scenario: Test default settings
- **GIVEN** Settings without environment variables
- **WHEN** get_settings is called
- **THEN** returns Settings with default values

### Requirement: Coverage Scope
The system SHALL exclude specific modules from coverage requirements.

#### Scenario: Exclude generation service model calls
- **WHEN** calculating coverage
- **THEN** `services/generation.py` model inference code is excluded from coverage requirements
- **AND** only request/response handling is tested

#### Scenario: Exclude database migrations
- **WHEN** calculating coverage
- **THEN** `alembic/` directory is excluded from coverage calculation

