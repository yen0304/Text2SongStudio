"""Tests for adapter schema validation."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.adapter import (
    AdapterCreate,
    AdapterDetailRead,
    AdapterListResponse,
    AdapterRead,
    AdapterTimelineEvent,
    AdapterTimelineResponse,
    AdapterUpdate,
    AdapterVersionRead,
)


class TestAdapterCreate:
    """Tests for AdapterCreate schema."""

    def test_valid_adapter_create(self):
        """Test creating a valid adapter."""
        adapter = AdapterCreate(
            name="Test Adapter",
            description="A test adapter",
            base_model="musicgen-small",
        )
        assert adapter.name == "Test Adapter"
        assert adapter.description == "A test adapter"
        assert adapter.base_model == "musicgen-small"

    def test_minimal_adapter_create(self):
        """Test creating adapter with minimal fields."""
        adapter = AdapterCreate(name="Minimal")
        assert adapter.name == "Minimal"
        assert adapter.description is None
        assert adapter.base_model == "musicgen-small"  # default

    def test_name_min_length(self):
        """Test name minimum length (1)."""
        adapter = AdapterCreate(name="A")
        assert adapter.name == "A"

    def test_name_max_length(self):
        """Test name maximum length (100)."""
        long_name = "a" * 100
        adapter = AdapterCreate(name=long_name)
        assert len(adapter.name) == 100

    def test_empty_name_raises_error(self):
        """Test that empty name raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            AdapterCreate(name="")
        assert "name" in str(exc_info.value)

    def test_name_exceeds_max_length_raises_error(self):
        """Test that name exceeding 100 characters raises ValidationError."""
        long_name = "a" * 101
        with pytest.raises(ValidationError) as exc_info:
            AdapterCreate(name=long_name)
        assert "name" in str(exc_info.value)

    def test_adapter_with_config(self):
        """Test adapter with configuration."""
        adapter = AdapterCreate(
            name="Configured Adapter",
            config={"learning_rate": 0.001, "epochs": 10},
        )
        assert adapter.config["learning_rate"] == 0.001
        assert adapter.config["epochs"] == 10

    def test_adapter_with_training_dataset(self):
        """Test adapter with training dataset reference."""
        dataset_id = uuid4()
        adapter = AdapterCreate(
            name="Trained Adapter",
            training_dataset_id=dataset_id,
        )
        assert adapter.training_dataset_id == dataset_id


class TestAdapterUpdate:
    """Tests for AdapterUpdate schema."""

    def test_valid_adapter_update(self):
        """Test creating a valid adapter update."""
        update = AdapterUpdate(
            name="Updated Name",
            description="Updated description",
            is_active=False,
        )
        assert update.name == "Updated Name"
        assert update.description == "Updated description"
        assert update.is_active is False

    def test_partial_update(self):
        """Test partial update with only some fields."""
        update = AdapterUpdate(is_active=True)
        assert update.name is None
        assert update.is_active is True

    def test_empty_update(self):
        """Test update with no fields."""
        update = AdapterUpdate()
        assert update.name is None
        assert update.description is None
        assert update.is_active is None
        assert update.status is None

    def test_status_update(self):
        """Test updating status field."""
        update = AdapterUpdate(status="archived")
        assert update.status == "archived"


class TestAdapterRead:
    """Tests for AdapterRead schema."""

    def test_valid_adapter_read(self):
        """Test creating a valid adapter read response."""
        adapter_id = uuid4()
        response = AdapterRead(
            id=adapter_id,
            name="Test Adapter",
            description="Test description",
            base_model="musicgen-small",
            status="active",
            current_version="v1.0",
            config={"key": "value"},
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        assert response.id == adapter_id
        assert response.name == "Test Adapter"
        assert response.status == "active"

    def test_adapter_read_defaults(self):
        """Test adapter read with default values."""
        adapter_id = uuid4()
        response = AdapterRead(
            id=adapter_id,
            name="Default Adapter",
            base_model="musicgen-small",
            created_at=datetime.utcnow(),
        )
        assert response.status == "active"
        assert response.is_active is True
        assert response.description is None


class TestAdapterListResponse:
    """Tests for AdapterListResponse schema."""

    def test_valid_list_response(self):
        """Test creating a valid list response."""
        response = AdapterListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0

    def test_list_with_items(self):
        """Test list response with adapter items."""
        adapter_id = uuid4()
        adapter = AdapterRead(
            id=adapter_id,
            name="Test",
            base_model="musicgen-small",
            created_at=datetime.utcnow(),
        )
        response = AdapterListResponse(items=[adapter], total=1)
        assert len(response.items) == 1
        assert response.total == 1


class TestAdapterVersionRead:
    """Tests for AdapterVersionRead schema."""

    def test_valid_version_read(self):
        """Test creating a valid version read response."""
        version_id = uuid4()
        adapter_id = uuid4()
        response = AdapterVersionRead(
            id=version_id,
            adapter_id=adapter_id,
            version="v1.0",
            description="Initial version",
            is_active=True,
            created_at=datetime.utcnow(),
        )
        assert response.id == version_id
        assert response.version == "v1.0"


class TestAdapterDetailRead:
    """Tests for AdapterDetailRead schema."""

    def test_valid_detail_read(self):
        """Test creating a valid detail read response."""
        adapter_id = uuid4()
        response = AdapterDetailRead(
            id=adapter_id,
            name="Detailed Adapter",
            base_model="musicgen-small",
            created_at=datetime.utcnow(),
            versions=[],
        )
        assert response.versions == []


class TestAdapterTimelineEvent:
    """Tests for AdapterTimelineEvent schema."""

    def test_valid_timeline_event(self):
        """Test creating a valid timeline event."""
        event = AdapterTimelineEvent(
            id="event-1",
            type="created",
            timestamp=datetime.utcnow(),
            title="Adapter Created",
            description="Initial adapter creation",
            metadata={"version": "v1.0"},
        )
        assert event.type == "created"
        assert event.title == "Adapter Created"


class TestAdapterTimelineResponse:
    """Tests for AdapterTimelineResponse schema."""

    def test_valid_timeline_response(self):
        """Test creating a valid timeline response."""
        response = AdapterTimelineResponse(
            adapter_id="adapter-123",
            adapter_name="Test Adapter",
            events=[],
            total_versions=3,
            total_training_runs=2,
        )
        assert response.adapter_name == "Test Adapter"
        assert response.total_versions == 3
