"""Tests for datasets router."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestListDatasets:
    """Tests for GET /datasets endpoint."""

    def test_list_datasets_empty(self, client):
        """Test listing datasets when empty."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 0

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/datasets")
            assert response.status_code == 200
            data = response.json()
            assert data["items"] == []
            assert data["total"] == 0

    def test_list_datasets_with_pagination(self, client):
        """Test listing datasets with pagination."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 50

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/datasets?page=2&limit=10")
            assert response.status_code == 200


class TestPreviewDataset:
    """Tests for POST /datasets/preview endpoint."""

    def test_preview_dataset_supervised(self, client):
        """Test previewing supervised dataset."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            with patch("app.routers.datasets.DatasetService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.count_samples = AsyncMock(return_value=100)
                mock_service_class.return_value = mock_service

                response = client.post(
                    "/datasets/preview",
                    json={
                        "type": "supervised",
                        "filter_query": {"min_rating": 3.0},
                    },
                )
                assert response.status_code == 200
                data = response.json()
                assert data["count"] == 100

    def test_preview_dataset_preference(self, client):
        """Test previewing preference dataset."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            with patch("app.routers.datasets.DatasetService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.count_samples = AsyncMock(return_value=50)
                mock_service_class.return_value = mock_service

                response = client.post(
                    "/datasets/preview",
                    json={"type": "preference"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["count"] == 50


class TestCreateDataset:
    """Tests for POST /datasets endpoint."""

    def test_create_dataset_success(self, client, sample_dataset_data):
        """Test successful dataset creation."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)
            mock_db.refresh = AsyncMock()

            with patch("app.routers.datasets.DatasetService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.count_samples = AsyncMock(return_value=100)
                mock_service_class.return_value = mock_service

                response = client.post("/datasets", json=sample_dataset_data)
                assert response.status_code == 201
                data = response.json()
                assert "id" in data
                assert data["name"] == sample_dataset_data["name"]

    def test_create_dataset_no_samples_fails(self, client, sample_dataset_data):
        """Test creating dataset with no matching samples fails."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            with patch("app.routers.datasets.DatasetService") as mock_service_class:
                mock_service = MagicMock()
                mock_service.count_samples = AsyncMock(return_value=0)
                mock_service_class.return_value = mock_service

                response = client.post("/datasets", json=sample_dataset_data)
                assert response.status_code == 400
                assert "No samples match" in response.json()["detail"]

    def test_create_dataset_empty_name_fails(self, client):
        """Test creating dataset with empty name fails."""
        response = client.post(
            "/datasets",
            json={"name": "", "type": "supervised"},
        )
        assert response.status_code == 422


class TestGetDataset:
    """Tests for GET /datasets/{dataset_id} endpoint."""

    def test_get_dataset_success(self, client):
        """Test successful dataset retrieval."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_dataset = MagicMock()
            mock_dataset.id = uuid4()
            mock_dataset.name = "Test Dataset"
            mock_dataset.description = "Test"
            mock_dataset.type = "supervised"
            mock_dataset.filter_query = {}
            mock_dataset.sample_count = 100
            mock_dataset.export_path = None
            mock_dataset.created_at = MagicMock()

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_dataset
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.get(f"/datasets/{mock_dataset.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Test Dataset"

    def test_get_dataset_not_found(self, client):
        """Test dataset not found returns 404."""
        with patch("app.routers.datasets.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            dataset_id = uuid4()
            response = client.get(f"/datasets/{dataset_id}")
            assert response.status_code == 404
