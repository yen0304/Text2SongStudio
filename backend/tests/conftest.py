"""Pytest configuration and fixtures."""

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


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


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
