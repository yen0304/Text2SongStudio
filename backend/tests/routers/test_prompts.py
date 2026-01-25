"""Tests for prompts router."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestCreatePrompt:
    """Tests for POST /prompts endpoint."""

    def test_create_prompt_success(self, client, sample_prompt_data):
        """Test successful prompt creation."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock the prompt model after commit
            mock_prompt = MagicMock()
            mock_prompt.id = uuid4()
            mock_prompt.text = sample_prompt_data["text"]
            mock_prompt.attributes = sample_prompt_data["attributes"]
            mock_prompt.created_at = MagicMock()
            mock_prompt.audio_samples = []

            mock_db.refresh = AsyncMock(
                side_effect=lambda p: setattr(p, "id", mock_prompt.id)
            )

            response = client.post("/prompts", json=sample_prompt_data)
            assert response.status_code == 201
            data = response.json()
            assert "id" in data
            assert data["text"] == sample_prompt_data["text"]

    def test_create_prompt_minimal(self, client):
        """Test creating prompt with minimal data."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            response = client.post("/prompts", json={"text": "Simple prompt"})
            assert response.status_code == 201

    def test_create_prompt_empty_text_fails(self, client):
        """Test that empty text fails validation."""
        response = client.post("/prompts", json={"text": ""})
        assert response.status_code == 422

    def test_create_prompt_text_too_long_fails(self, client):
        """Test that text exceeding max length fails validation."""
        long_text = "a" * 2001
        response = client.post("/prompts", json={"text": long_text})
        assert response.status_code == 422


class TestGetPrompt:
    """Tests for GET /prompts/{prompt_id} endpoint."""

    def test_get_prompt_success(self, client, mock_prompt_model):
        """Test successful prompt retrieval."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_prompt_model
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.get(f"/prompts/{mock_prompt_model.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(mock_prompt_model.id)

    def test_get_prompt_not_found(self, client):
        """Test prompt not found returns 404."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            prompt_id = uuid4()
            response = client.get(f"/prompts/{prompt_id}")
            assert response.status_code == 404
            assert response.json()["detail"] == "Prompt not found"


class TestListPrompts:
    """Tests for GET /prompts endpoint."""

    def test_list_prompts_empty(self, client):
        """Test listing prompts when empty."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock count result
            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 0

            # Mock list result
            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/prompts")
            assert response.status_code == 200
            data = response.json()
            assert data["items"] == []
            assert data["total"] == 0

    def test_list_prompts_with_pagination(self, client, mock_prompt_model):
        """Test listing prompts with pagination."""
        with patch("app.routers.prompts.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock count result
            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 50

            # Mock list result
            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = [mock_prompt_model]

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/prompts?page=2&limit=10")
            assert response.status_code == 200
            data = response.json()
            assert data["page"] == 2
            assert data["limit"] == 10

    def test_list_prompts_invalid_page(self, client):
        """Test that invalid page number fails validation."""
        response = client.get("/prompts?page=0")
        assert response.status_code == 422

    def test_list_prompts_invalid_limit(self, client):
        """Test that invalid limit fails validation."""
        response = client.get("/prompts?limit=101")
        assert response.status_code == 422
