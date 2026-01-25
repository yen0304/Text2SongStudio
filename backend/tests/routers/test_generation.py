"""Tests for generation router."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestSubmitGeneration:
    """Tests for POST /generate endpoint."""

    def test_submit_generation_success(self, client, sample_prompt_id):
        """Test successful generation submission."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)
            mock_db.refresh = AsyncMock()

            # Mock prompt exists
            mock_prompt = MagicMock()
            mock_prompt.id = sample_prompt_id
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_prompt
            mock_db.execute = AsyncMock(return_value=mock_result)

            with patch("app.routers.generation.GenerationService.process_job"):
                response = client.post(
                    "/generate",
                    json={
                        "prompt_id": str(sample_prompt_id),
                        "num_samples": 2,
                    },
                )
                assert response.status_code == 201
                data = response.json()
                assert "id" in data
                assert data["status"] == "queued"

    def test_submit_generation_prompt_not_found(self, client):
        """Test generation submission with non-existent prompt fails."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock prompt not found
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            prompt_id = uuid4()
            response = client.post(
                "/generate",
                json={"prompt_id": str(prompt_id)},
            )
            assert response.status_code == 404
            assert "Prompt not found" in response.json()["detail"]

    def test_submit_generation_with_deleted_adapter_fails(
        self, client, sample_prompt_id
    ):
        """Test generation with deleted adapter fails."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock prompt exists
            mock_prompt = MagicMock()
            mock_prompt_result = MagicMock()
            mock_prompt_result.scalar_one_or_none.return_value = mock_prompt

            # Mock adapter is deleted
            mock_adapter = MagicMock()
            mock_adapter.deleted_at = datetime.utcnow()
            mock_adapter_result = MagicMock()
            mock_adapter_result.scalar_one_or_none.return_value = mock_adapter

            mock_db.execute = AsyncMock(
                side_effect=[mock_prompt_result, mock_adapter_result]
            )

            adapter_id = uuid4()
            response = client.post(
                "/generate",
                json={
                    "prompt_id": str(sample_prompt_id),
                    "adapter_id": str(adapter_id),
                },
            )
            assert response.status_code == 400
            assert "deleted adapter" in response.json()["detail"]

    def test_submit_generation_invalid_num_samples(self, client, sample_prompt_id):
        """Test generation with invalid num_samples fails validation."""
        response = client.post(
            "/generate",
            json={
                "prompt_id": str(sample_prompt_id),
                "num_samples": 5,  # Max is 4
            },
        )
        assert response.status_code == 422


class TestGetJobStatus:
    """Tests for GET /generate/{job_id} endpoint."""

    def test_get_job_status_success(self, client):
        """Test successful job status retrieval."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_job = MagicMock()
            mock_job.id = uuid4()
            mock_job.status = MagicMock(value="running")
            mock_job.progress = 0.5
            mock_job.audio_ids = []
            mock_job.error = None
            mock_job.created_at = datetime.utcnow()

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_job
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.get(f"/generate/{mock_job.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "running"
            assert data["progress"] == 0.5

    def test_get_job_status_not_found(self, client):
        """Test job status not found returns 404."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            job_id = uuid4()
            response = client.get(f"/generate/{job_id}")
            assert response.status_code == 404


class TestCancelJob:
    """Tests for DELETE /generate/{job_id} endpoint."""

    def test_cancel_job_success(self, client):
        """Test successful job cancellation."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            from app.models import JobStatus

            mock_job = MagicMock()
            mock_job.id = uuid4()
            mock_job.status = JobStatus.RUNNING

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_job
            mock_db.execute = AsyncMock(return_value=mock_result)

            with patch("app.routers.generation.GenerationService.cancel_job"):
                response = client.delete(f"/generate/{mock_job.id}")
                assert response.status_code == 204

    def test_cancel_job_not_found(self, client):
        """Test cancelling non-existent job returns 404."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            job_id = uuid4()
            response = client.delete(f"/generate/{job_id}")
            assert response.status_code == 404

    def test_cancel_completed_job_fails(self, client):
        """Test cancelling completed job fails."""
        with patch("app.routers.generation.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            from app.models import JobStatus

            mock_job = MagicMock()
            mock_job.id = uuid4()
            mock_job.status = JobStatus.COMPLETED

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_job
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.delete(f"/generate/{mock_job.id}")
            assert response.status_code == 400
            assert "Cannot cancel completed or failed job" in response.json()["detail"]
