"""Tests for adapters router."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestListAdapters:
    """Tests for GET /adapters endpoint."""

    def test_list_adapters_empty(self, client):
        """Test listing adapters when empty."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 0

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/adapters")
            assert response.status_code == 200
            data = response.json()
            assert data["items"] == []
            assert data["total"] == 0

    def test_list_adapters_with_filters(self, client, mock_adapter_model):
        """Test listing adapters with filters."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 1

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = [
                mock_adapter_model
            ]

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/adapters?active_only=true&status=active")
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1


class TestGetAdapter:
    """Tests for GET /adapters/{adapter_id} endpoint."""

    def test_get_adapter_success(self, client, mock_adapter_model):
        """Test successful adapter retrieval."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_adapter_model
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.get(f"/adapters/{mock_adapter_model.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(mock_adapter_model.id)
            assert data["name"] == mock_adapter_model.name

    def test_get_adapter_not_found(self, client):
        """Test adapter not found returns 404."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            adapter_id = uuid4()
            response = client.get(f"/adapters/{adapter_id}")
            assert response.status_code == 404


class TestCreateAdapter:
    """Tests for POST /adapters endpoint."""

    def test_create_adapter_success(self, client, sample_adapter_data):
        """Test successful adapter creation."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)
            mock_db.refresh = AsyncMock()

            response = client.post("/adapters", json=sample_adapter_data)
            assert response.status_code == 201
            data = response.json()
            assert "id" in data
            assert data["name"] == sample_adapter_data["name"]

    def test_create_adapter_empty_name_fails(self, client):
        """Test creating adapter with empty name fails."""
        response = client.post("/adapters", json={"name": ""})
        assert response.status_code == 422

    def test_create_adapter_name_too_long_fails(self, client):
        """Test creating adapter with name too long fails."""
        long_name = "a" * 101
        response = client.post("/adapters", json={"name": long_name})
        assert response.status_code == 422


class TestGetAdapterStats:
    """Tests for GET /adapters/stats endpoint."""

    def test_get_adapter_stats(self, client):
        """Test getting adapter statistics."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock all count results
            mock_results = []
            for val in [10, 5, 20]:
                mock_result = MagicMock()
                mock_result.scalar.return_value = val
                mock_results.append(mock_result)

            mock_db.execute = AsyncMock(side_effect=mock_results)

            response = client.get("/adapters/stats")
            assert response.status_code == 200
            data = response.json()
            assert "total" in data
            assert "active" in data


class TestUpdateAdapter:
    """Tests for PATCH /adapters/{adapter_id} endpoint."""

    def test_update_adapter_success(self, client, mock_adapter_model):
        """Test successful adapter update."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_adapter_model
            mock_db.execute = AsyncMock(return_value=mock_result)
            mock_db.refresh = AsyncMock()

            response = client.patch(
                f"/adapters/{mock_adapter_model.id}",
                json={"name": "Updated Name"},
            )
            assert response.status_code == 200

    def test_update_adapter_not_found(self, client):
        """Test updating non-existent adapter returns 404."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            adapter_id = uuid4()
            response = client.patch(
                f"/adapters/{adapter_id}",
                json={"name": "Updated Name"},
            )
            assert response.status_code == 404


class TestDeleteAdapter:
    """Tests for DELETE /adapters/{adapter_id} endpoint."""

    def test_delete_adapter_success(self, client, mock_adapter_model):
        """Test successful adapter deletion (soft delete)."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_adapter_model
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.delete(f"/adapters/{mock_adapter_model.id}")
            assert response.status_code == 204

    def test_delete_adapter_not_found(self, client):
        """Test deleting non-existent adapter returns 404."""
        with patch("app.routers.adapters.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            adapter_id = uuid4()
            response = client.delete(f"/adapters/{adapter_id}")
            assert response.status_code == 404
