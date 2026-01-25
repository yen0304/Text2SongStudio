"""Tests for audio router."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestGetAudioMetadata:
    """Tests for GET /audio/{audio_id} endpoint."""

    def test_get_audio_metadata_success(self, client, mock_audio_sample_model):
        """Test successful audio metadata retrieval."""
        with patch("app.routers.audio.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_audio_sample_model
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.get(f"/audio/{mock_audio_sample_model.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(mock_audio_sample_model.id)
            assert data["duration_seconds"] == mock_audio_sample_model.duration_seconds

    def test_get_audio_metadata_not_found(self, client):
        """Test audio metadata not found returns 404."""
        with patch("app.routers.audio.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            audio_id = uuid4()
            response = client.get(f"/audio/{audio_id}")
            assert response.status_code == 404
            assert response.json()["detail"] == "Audio sample not found"


class TestStreamAudio:
    """Tests for GET /audio/{audio_id}/stream endpoint."""

    def test_stream_audio_not_found(self, client):
        """Test streaming non-existent audio returns 404."""
        with patch("app.routers.audio.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            audio_id = uuid4()
            response = client.get(f"/audio/{audio_id}/stream")
            assert response.status_code == 404


class TestCompareAudio:
    """Tests for POST /audio/compare endpoint."""

    def test_compare_audio_success(self, client, mock_audio_sample_model):
        """Test successful audio comparison."""
        with patch("app.routers.audio.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Create two mock audio samples
            audio1 = mock_audio_sample_model
            audio2 = MagicMock()
            audio2.id = uuid4()
            audio2.prompt_id = audio1.prompt_id
            audio2.adapter_id = None
            audio2.duration_seconds = 10.0
            audio2.sample_rate = 44100
            audio2.generation_params = {}
            audio2.created_at = audio1.created_at

            mock_result = MagicMock()
            mock_result.scalars.return_value.all.return_value = [audio1, audio2]
            mock_db.execute = AsyncMock(return_value=mock_result)

            response = client.post(
                "/audio/compare",
                json={"audio_ids": [str(audio1.id), str(audio2.id)]},
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["samples"]) == 2

    def test_compare_audio_some_not_found(self, client, mock_audio_sample_model):
        """Test comparing audio when some samples not found."""
        with patch("app.routers.audio.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Only one sample found
            mock_result = MagicMock()
            mock_result.scalars.return_value.all.return_value = [
                mock_audio_sample_model
            ]
            mock_db.execute = AsyncMock(return_value=mock_result)

            missing_id = uuid4()
            response = client.post(
                "/audio/compare",
                json={"audio_ids": [str(mock_audio_sample_model.id), str(missing_id)]},
            )
            assert response.status_code == 404
            assert "Audio samples not found" in response.json()["detail"]

    def test_compare_audio_empty_list(self, client):
        """Test comparing with empty audio list."""
        response = client.post(
            "/audio/compare",
            json={"audio_ids": []},
        )
        # Depending on validation, this may succeed or fail
        # The endpoint should handle empty lists appropriately
        assert response.status_code in [200, 422]
