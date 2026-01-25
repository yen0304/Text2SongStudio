"""Tests for experiment schema validation."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentDetailResponse,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentRunCreate,
    ExperimentRunResponse,
    ExperimentUpdate,
)


class TestExperimentCreate:
    """Tests for ExperimentCreate schema."""

    def test_valid_experiment_create(self):
        """Test creating a valid experiment."""
        experiment = ExperimentCreate(
            name="Test Experiment",
            description="Testing experiment creation",
            config={"epochs": 10, "batch_size": 4},
        )
        assert experiment.name == "Test Experiment"
        assert experiment.description == "Testing experiment creation"
        assert experiment.config["epochs"] == 10

    def test_minimal_experiment_create(self):
        """Test creating experiment with minimal fields."""
        experiment = ExperimentCreate(name="Minimal")
        assert experiment.name == "Minimal"
        assert experiment.description is None
        assert experiment.dataset_id is None
        assert experiment.config is None

    def test_name_min_length(self):
        """Test name minimum length (1)."""
        experiment = ExperimentCreate(name="E")
        assert experiment.name == "E"

    def test_name_max_length(self):
        """Test name maximum length (200)."""
        long_name = "a" * 200
        experiment = ExperimentCreate(name=long_name)
        assert len(experiment.name) == 200

    def test_empty_name_raises_error(self):
        """Test that empty name raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            ExperimentCreate(name="")
        assert "name" in str(exc_info.value)

    def test_name_exceeds_max_length_raises_error(self):
        """Test that name exceeding 200 characters raises ValidationError."""
        long_name = "a" * 201
        with pytest.raises(ValidationError) as exc_info:
            ExperimentCreate(name=long_name)
        assert "name" in str(exc_info.value)

    def test_experiment_with_dataset_id(self):
        """Test experiment with dataset reference."""
        dataset_id = uuid4()
        experiment = ExperimentCreate(
            name="Dataset Experiment",
            dataset_id=dataset_id,
        )
        assert experiment.dataset_id == dataset_id


class TestExperimentUpdate:
    """Tests for ExperimentUpdate schema."""

    def test_valid_experiment_update(self):
        """Test creating a valid experiment update."""
        update = ExperimentUpdate(
            name="Updated Name",
            description="Updated description",
        )
        assert update.name == "Updated Name"
        assert update.description == "Updated description"

    def test_partial_update(self):
        """Test partial update with only some fields."""
        update = ExperimentUpdate(description="Only description")
        assert update.name is None
        assert update.description == "Only description"

    def test_empty_update(self):
        """Test update with no fields."""
        update = ExperimentUpdate()
        assert update.name is None
        assert update.description is None
        assert update.dataset_id is None
        assert update.config is None

    def test_update_name_validation(self):
        """Test that update name validation works."""
        # Empty string should fail
        with pytest.raises(ValidationError) as exc_info:
            ExperimentUpdate(name="")
        assert "name" in str(exc_info.value)


class TestExperimentRunCreate:
    """Tests for ExperimentRunCreate schema."""

    def test_valid_run_create(self):
        """Test creating a valid experiment run."""
        run = ExperimentRunCreate(
            name="Run 1",
            config={"learning_rate": 0.001},
        )
        assert run.name == "Run 1"
        assert run.config["learning_rate"] == 0.001

    def test_minimal_run_create(self):
        """Test creating run with no fields."""
        run = ExperimentRunCreate()
        assert run.name is None
        assert run.config is None


class TestExperimentRunResponse:
    """Tests for ExperimentRunResponse schema."""

    def test_valid_run_response(self):
        """Test creating a valid run response."""
        run_id = uuid4()
        experiment_id = uuid4()
        adapter_id = uuid4()
        response = ExperimentRunResponse(
            id=run_id,
            experiment_id=experiment_id,
            adapter_id=adapter_id,
            name="Run 1",
            status="completed",
            config={"epochs": 10},
            metrics={"loss": 0.5, "accuracy": 0.9},
            final_loss=0.5,
            error=None,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        assert response.id == run_id
        assert response.status == "completed"
        assert response.final_loss == 0.5

    def test_run_response_with_error(self):
        """Test run response with error."""
        run_id = uuid4()
        experiment_id = uuid4()
        response = ExperimentRunResponse(
            id=run_id,
            experiment_id=experiment_id,
            status="failed",
            error="Out of memory",
            created_at=datetime.utcnow(),
        )
        assert response.status == "failed"
        assert response.error == "Out of memory"
        assert response.adapter_id is None


class TestExperimentResponse:
    """Tests for ExperimentResponse schema."""

    def test_valid_experiment_response(self):
        """Test creating a valid experiment response."""
        experiment_id = uuid4()
        best_run_id = uuid4()
        response = ExperimentResponse(
            id=experiment_id,
            name="Test Experiment",
            description="Description",
            status="completed",
            config={"key": "value"},
            best_run_id=best_run_id,
            best_loss=0.3,
            run_count=5,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        assert response.id == experiment_id
        assert response.best_loss == 0.3
        assert response.run_count == 5

    def test_experiment_response_defaults(self):
        """Test experiment response with default values."""
        experiment_id = uuid4()
        response = ExperimentResponse(
            id=experiment_id,
            name="New Experiment",
            status="draft",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        assert response.run_count == 0
        assert response.best_run_id is None
        assert response.best_loss is None


class TestExperimentDetailResponse:
    """Tests for ExperimentDetailResponse schema."""

    def test_valid_detail_response(self):
        """Test creating a valid detail response."""
        experiment_id = uuid4()
        response = ExperimentDetailResponse(
            id=experiment_id,
            name="Detailed Experiment",
            status="running",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            runs=[],
        )
        assert response.runs == []

    def test_detail_response_with_runs(self):
        """Test detail response with runs."""
        experiment_id = uuid4()
        run = ExperimentRunResponse(
            id=uuid4(),
            experiment_id=experiment_id,
            status="completed",
            created_at=datetime.utcnow(),
        )
        response = ExperimentDetailResponse(
            id=experiment_id,
            name="Experiment with Runs",
            status="completed",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            runs=[run],
        )
        assert len(response.runs) == 1


class TestExperimentListResponse:
    """Tests for ExperimentListResponse schema."""

    def test_valid_list_response(self):
        """Test creating a valid list response."""
        response = ExperimentListResponse(
            items=[],
            total=0,
            limit=20,
            offset=0,
        )
        assert response.items == []
        assert response.total == 0
        assert response.limit == 20
        assert response.offset == 0
