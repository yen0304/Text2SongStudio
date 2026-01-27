"""Pytest configuration and fixtures.

Testing Strategy:
-----------------
This project uses MOCK-BASED testing for unit tests. All database operations
are mocked using unittest.mock to ensure:
1. Tests are fast and don't require a running database
2. Tests are isolated and don't affect production data
3. Tests are deterministic and reproducible

For integration tests that require a real database, consider:
- Using a separate test database (e.g., text2song_test)
- Using pytest-docker or testcontainers for ephemeral databases
- Running tests in CI with a dedicated test database service
"""

import sys
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

# Mock external dependencies before importing app modules
# This prevents importing soundfile, transformers, torch, peft, etc.
# These are LLM/HuggingFace related and should be excluded from tests
mock_modules = [
    "soundfile",
    "sf",
    "transformers",
    "torch",
    "torchaudio",
    "peft",
]
for mod_name in mock_modules:
    sys.modules[mod_name] = MagicMock()


# Store patchers at module level so they persist across tests
_init_db_patcher = None
_app_instance = None


@pytest.fixture(scope="session", autouse=True)
def mock_init_db():
    """Mock init_db at session level to avoid actual DB connections.

    This ensures the app's lifespan doesn't try to connect to the real database.
    All database operations in tests should use mock_db_session fixture.
    """
    global _init_db_patcher
    _init_db_patcher = patch("app.main.init_db", new_callable=AsyncMock)
    _init_db_patcher.start()
    yield
    _init_db_patcher.stop()


@pytest.fixture
def client(mock_init_db):  # noqa: ARG001
    """Create a test client for the FastAPI app."""
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_db_session():
    """Create a mock database session for router tests.

    This fixture creates a mock AsyncSession and sets up FastAPI's
    dependency_overrides so that get_db returns this mock session.
    The override is automatically cleaned up after the test.
    """
    from app.database import get_db
    from app.main import app

    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    mock_session.execute = AsyncMock()
    mock_session.scalar = AsyncMock()
    mock_session.get = AsyncMock()
    mock_session.delete = AsyncMock()

    # Mock refresh to simulate database behavior (setting default values)
    async def mock_refresh(obj):
        from app.models.experiment import ExperimentStatus

        if not hasattr(obj, "id") or obj.id is None:
            obj.id = uuid4()
        if not hasattr(obj, "status") or obj.status is None:
            obj.status = ExperimentStatus.DRAFT
        if not hasattr(obj, "is_active") or obj.is_active is None:
            obj.is_active = True
        if not hasattr(obj, "created_at") or obj.created_at is None:
            obj.created_at = datetime.utcnow()
        if not hasattr(obj, "updated_at") or obj.updated_at is None:
            obj.updated_at = datetime.utcnow()
        if not hasattr(obj, "deleted_at"):
            obj.deleted_at = None

    mock_session.refresh = mock_refresh

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    yield mock_session
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def mock_db():
    """Create a mock AsyncSession for database operations."""
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    mock_session.refresh = AsyncMock()
    mock_session.execute = AsyncMock()
    mock_session.scalar = AsyncMock()
    return mock_session


@pytest.fixture
def mock_storage():
    """Create a mock StorageService."""
    with patch("app.services.storage.boto3") as mock_boto3:
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client
        yield mock_client


@pytest.fixture
def sample_prompt_id() -> UUID:
    """Generate a sample prompt UUID."""
    return uuid4()


@pytest.fixture
def sample_audio_id() -> UUID:
    """Generate a sample audio UUID."""
    return uuid4()


@pytest.fixture
def sample_adapter_id() -> UUID:
    """Generate a sample adapter UUID."""
    return uuid4()


@pytest.fixture
def sample_prompt_data() -> dict[str, Any]:
    """Sample prompt data for testing."""
    return {
        "text": "A calm piano melody with soft strings",
        "attributes": {
            "style": "classical",
            "tempo": 80,
            "primary_instruments": ["acoustic-piano"],
            "secondary_instruments": ["violin"],
            "mood": "calm",
            "duration": 10,
        },
    }


@pytest.fixture
def sample_feedback_data(sample_audio_id: UUID) -> dict[str, Any]:
    """Sample feedback data for testing."""
    return {
        "audio_id": str(sample_audio_id),
        "rating": 4.5,
        "rating_criterion": "overall",
        "tags": ["melodic", "relaxing"],
        "notes": "Great composition",
    }


@pytest.fixture
def sample_adapter_data() -> dict[str, Any]:
    """Sample adapter data for testing."""
    return {
        "name": "Test Adapter",
        "description": "A test adapter for unit testing",
        "base_model": "musicgen-small",
        "config": {"learning_rate": 0.001},
    }


@pytest.fixture
def sample_dataset_data() -> dict[str, Any]:
    """Sample dataset data for testing."""
    return {
        "name": "Test Dataset",
        "description": "A test dataset",
        "type": "supervised",
        "filter_query": {
            "min_rating": 3.0,
            "max_rating": 5.0,
        },
    }


@pytest.fixture
def sample_experiment_data() -> dict[str, Any]:
    """Sample experiment data for testing."""
    return {
        "name": "Test Experiment",
        "description": "A test experiment",
        "config": {
            "epochs": 10,
            "batch_size": 4,
        },
    }


@pytest.fixture
def sample_generation_request(sample_prompt_id: UUID) -> dict[str, Any]:
    """Sample generation request for testing."""
    return {
        "prompt_id": str(sample_prompt_id),
        "num_samples": 2,
        "temperature": 1.0,
        "top_k": 250,
        "top_p": 0.0,
        "duration": 10,
    }


@pytest.fixture
def mock_prompt_model(sample_prompt_id: UUID):
    """Create a mock Prompt model instance."""
    mock = MagicMock()
    mock.id = sample_prompt_id
    mock.text = "A calm piano melody"
    mock.attributes = {"style": "classical", "tempo": 80}
    mock.created_at = datetime.utcnow()
    mock.audio_samples = []
    return mock


@pytest.fixture
def mock_audio_sample_model(sample_audio_id: UUID, sample_prompt_id: UUID):
    """Create a mock AudioSample model instance."""
    mock = MagicMock()
    mock.id = sample_audio_id
    mock.prompt_id = sample_prompt_id
    mock.adapter_id = None
    mock.storage_path = f"audio/{sample_audio_id}.wav"
    mock.duration_seconds = 10.0
    mock.sample_rate = 44100
    mock.generation_params = {}
    mock.created_at = datetime.utcnow()
    return mock


@pytest.fixture
def mock_feedback_model(sample_audio_id: UUID):
    """Create a mock Feedback model instance."""
    mock = MagicMock()
    mock.id = uuid4()
    mock.audio_id = sample_audio_id
    mock.user_id = None
    mock.rating = 4.5
    mock.rating_criterion = "overall"
    mock.preferred_over = None
    mock.tags = ["melodic"]
    mock.notes = "Great"
    mock.created_at = datetime.utcnow()
    return mock


@pytest.fixture
def mock_adapter_model(sample_adapter_id: UUID):
    """Create a mock Adapter model instance."""
    mock = MagicMock()
    mock.id = sample_adapter_id
    mock.name = "Test Adapter"
    mock.description = "Test description"
    mock.base_model = "musicgen-small"
    mock.status = "active"
    mock.current_version = "v1"
    mock.config = {}
    mock.is_active = True
    mock.deleted_at = None
    mock.created_at = datetime.utcnow()
    mock.updated_at = datetime.utcnow()
    mock.versions = []
    return mock
