"""Tests for feedback router."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


class TestSubmitFeedback:
    """Tests for POST /feedback endpoint."""

    def test_submit_feedback_with_rating(self, client, sample_audio_id):
        """Test submitting feedback with rating."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock audio sample exists
            mock_audio_result = MagicMock()
            mock_audio_result.scalar_one_or_none.return_value = MagicMock()
            mock_db.execute = AsyncMock(return_value=mock_audio_result)

            # Mock feedback after commit
            mock_feedback = MagicMock()
            mock_feedback.id = uuid4()
            mock_feedback.audio_id = sample_audio_id
            mock_feedback.user_id = None
            mock_feedback.rating = 4.5
            mock_feedback.rating_criterion = "overall"
            mock_feedback.preferred_over = None
            mock_feedback.tags = []
            mock_feedback.notes = None
            mock_feedback.created_at = MagicMock()

            mock_db.refresh = AsyncMock()

            response = client.post(
                "/feedback",
                json={
                    "audio_id": str(sample_audio_id),
                    "rating": 4.5,
                },
            )
            assert response.status_code == 201

    def test_submit_feedback_audio_not_found(self, client):
        """Test submitting feedback for non-existent audio."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock audio sample not found
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            mock_db.execute = AsyncMock(return_value=mock_result)

            audio_id = uuid4()
            response = client.post(
                "/feedback",
                json={
                    "audio_id": str(audio_id),
                    "rating": 4.0,
                },
            )
            assert response.status_code == 404
            assert "Audio sample not found" in response.json()["detail"]

    def test_submit_feedback_empty_fails(self, client, sample_audio_id):
        """Test submitting feedback without rating, preference, or tags fails."""
        response = client.post(
            "/feedback",
            json={
                "audio_id": str(sample_audio_id),
            },
        )
        assert response.status_code == 422

    def test_submit_feedback_with_preference(self, client, sample_audio_id):
        """Test submitting feedback with preference."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock audio samples exist
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = MagicMock()
            mock_db.execute = AsyncMock(return_value=mock_result)
            mock_db.refresh = AsyncMock()

            preferred_id = uuid4()
            response = client.post(
                "/feedback",
                json={
                    "audio_id": str(sample_audio_id),
                    "preferred_over": str(preferred_id),
                },
            )
            assert response.status_code == 201

    def test_submit_feedback_preferred_over_not_found(self, client, sample_audio_id):
        """Test submitting feedback with non-existent preferred_over audio."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # First call returns audio, second returns None for preferred_over
            mock_result1 = MagicMock()
            mock_result1.scalar_one_or_none.return_value = MagicMock()
            mock_result2 = MagicMock()
            mock_result2.scalar_one_or_none.return_value = None

            mock_db.execute = AsyncMock(side_effect=[mock_result1, mock_result2])

            preferred_id = uuid4()
            response = client.post(
                "/feedback",
                json={
                    "audio_id": str(sample_audio_id),
                    "preferred_over": str(preferred_id),
                },
            )
            assert response.status_code == 404
            assert "Preferred-over audio sample not found" in response.json()["detail"]


class TestGetFeedbackSummary:
    """Tests for GET /feedback/summary endpoint."""

    def test_get_feedback_summary(self, client):
        """Test getting feedback summary."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            # Mock all the count queries
            mock_results = []
            for val in [100, 80, 20]:
                mock_result = MagicMock()
                mock_result.scalar.return_value = val
                mock_results.append(mock_result)

            # Mock ratings query
            mock_ratings = MagicMock()
            mock_ratings.fetchall.return_value = [(4,), (5,), (4,), (3,)]
            mock_results.append(mock_ratings)

            # Mock high rated count
            mock_high = MagicMock()
            mock_high.scalar.return_value = 45
            mock_results.append(mock_high)

            mock_db.execute = AsyncMock(side_effect=mock_results)

            response = client.get("/feedback/summary")
            assert response.status_code == 200
            data = response.json()
            assert "total_feedback" in data
            assert "rating_distribution" in data


class TestListFeedback:
    """Tests for GET /feedback endpoint."""

    def test_list_feedback_empty(self, client):
        """Test listing feedback when empty."""
        with patch("app.routers.feedback.get_db") as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__anext__ = AsyncMock(return_value=mock_db)

            mock_count_result = MagicMock()
            mock_count_result.scalar.return_value = 0

            mock_list_result = MagicMock()
            mock_list_result.scalars.return_value.all.return_value = []

            mock_db.execute = AsyncMock(
                side_effect=[mock_count_result, mock_list_result]
            )

            response = client.get("/feedback")
            assert response.status_code == 200
            data = response.json()
            assert data["items"] == []
            assert data["total"] == 0
