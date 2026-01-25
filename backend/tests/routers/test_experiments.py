"""Tests for experiments router."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestListExperiments:
    """Tests for GET /experiments endpoint."""

    def test_list_experiments_empty(self, client):
        """Test listing experiments when empty."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_db.scalar = AsyncMock(return_value=0)

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []
            mock_db.execute = AsyncMock(return_value=mock_list_result)

            response = client.get("/experiments")
            assert response.status_code == 200
            data = response.json()
            assert data["items"] == []
            assert data["total"] == 0

    def test_list_experiments_with_status_filter(self, client):
        """Test listing experiments with status filter."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_db.scalar = AsyncMock(return_value=0)

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []
            mock_db.execute = AsyncMock(return_value=mock_list_result)

            response = client.get("/experiments?status=running")
            assert response.status_code == 200


class TestCreateExperiment:
    """Tests for POST /experiments endpoint."""

    def test_create_experiment_success(self, client, sample_experiment_data):
        """Test successful experiment creation."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)
            mock_db.refresh = AsyncMock()

            response = client.post("/experiments", json=sample_experiment_data)
            assert response.status_code == 201
            data = response.json()
            assert "id" in data
            assert data["name"] == sample_experiment_data["name"]

    def test_create_experiment_with_dataset(self, client, sample_experiment_data):
        """Test creating experiment with dataset reference."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)
            mock_db.refresh = AsyncMock()

            # Mock dataset exists
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = MagicMock()
            mock_db.execute = AsyncMock(return_value=mock_result)

            dataset_id = uuid4()
            sample_experiment_data["dataset_id"] = str(dataset_id)

            response = client.post("/experiments", json=sample_experiment_data)
            assert response.status_code == 201

    def test_create_experiment_dataset_not_found(self, client, sample_experiment_data):
        """Test creating experiment with non-existent dataset fails."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock dataset not found
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            dataset_id = uuid4()
            sample_experiment_data["dataset_id"] = str(dataset_id)

            response = client.post("/experiments", json=sample_experiment_data)
            assert response.status_code == 404
            assert "Dataset not found" in response.json()["detail"]

    def test_create_experiment_empty_name_fails(self, client):
        """Test creating experiment with empty name fails."""
        response = client.post("/experiments", json={"name": ""})
        assert response.status_code == 422


class TestGetExperiment:
    """Tests for GET /experiments/{experiment_id} endpoint."""

    def test_get_experiment_success(self, client):
        """Test successful experiment retrieval."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_experiment = MagicMock()
            mock_experiment.id = uuid4()
            mock_experiment.name = "Test Experiment"
            mock_experiment.description = "Test"
            mock_experiment.dataset_id = None
            mock_experiment.status = MagicMock(value="draft")
            mock_experiment.config = {}
            mock_experiment.best_run_id = None
            mock_experiment.best_loss = None
            mock_experiment.created_at = datetime.utcnow()
            mock_experiment.updated_at = datetime.utcnow()

            mock_result1 = MagicMock()
            mock_result1.scalar_one_or_none.return_value = mock_experiment

            mock_result2 = MagicMock()
            mock_result2.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(side_effect=[mock_result1, mock_result2])

            response = client.get(f"/experiments/{mock_experiment.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Test Experiment"

    def test_get_experiment_not_found(self, client):
        """Test experiment not found returns 404."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            experiment_id = uuid4()
            response = client.get(f"/experiments/{experiment_id}")
            assert response.status_code == 404


class TestUpdateExperiment:
    """Tests for PATCH /experiments/{experiment_id} endpoint."""

    def test_update_experiment_success(self, client):
        """Test successful experiment update."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_experiment = MagicMock()
            mock_experiment.id = uuid4()
            mock_experiment.name = "Original"
            mock_experiment.description = None
            mock_experiment.dataset_id = None
            mock_experiment.status = MagicMock(value="draft")
            mock_experiment.config = {}
            mock_experiment.best_run_id = None
            mock_experiment.best_loss = None
            mock_experiment.created_at = datetime.utcnow()
            mock_experiment.updated_at = datetime.utcnow()

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_experiment
            mock_db.execute = AsyncMock(return_value=mock_result)
            mock_db.scalar = AsyncMock(return_value=0)
            mock_db.refresh = AsyncMock()

            response = client.patch(
                f"/experiments/{mock_experiment.id}",
                json={"name": "Updated Name"},
            )
            assert response.status_code == 200

    def test_update_experiment_not_found(self, client):
        """Test updating non-existent experiment returns 404."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            experiment_id = uuid4()
            response = client.patch(
                f"/experiments/{experiment_id}",
                json={"name": "Updated"},
            )
            assert response.status_code == 404


class TestDeleteExperiment:
    """Tests for DELETE /experiments/{experiment_id} endpoint."""

    def test_delete_experiment_success(self, client):
        """Test successful experiment deletion."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_experiment = MagicMock()
            mock_experiment.id = uuid4()

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_experiment
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.delete(f"/experiments/{mock_experiment.id}")
            assert response.status_code == 204

    def test_delete_experiment_not_found(self, client):
        """Test deleting non-existent experiment returns 404."""
        with patch("app.routers.experiments.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            experiment_id = uuid4()
            response = client.delete(f"/experiments/{experiment_id}")
            assert response.status_code == 404
