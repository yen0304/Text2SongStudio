"""Tests for feedback schema validation."""

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackStatsResponse,
    FeedbackSummaryResponse,
)


class TestFeedbackCreate:
    """Tests for FeedbackCreate schema."""

    def test_valid_feedback_with_rating(self):
        """Test creating feedback with rating only."""
        audio_id = uuid4()
        feedback = FeedbackCreate(
            audio_id=audio_id,
            rating=4.5,
        )
        assert feedback.audio_id == audio_id
        assert feedback.rating == 4.5
        assert feedback.preferred_over is None
        assert feedback.tags is None

    def test_valid_feedback_with_preference(self):
        """Test creating feedback with preference only."""
        audio_id = uuid4()
        preferred_id = uuid4()
        feedback = FeedbackCreate(
            audio_id=audio_id,
            preferred_over=preferred_id,
        )
        assert feedback.audio_id == audio_id
        assert feedback.preferred_over == preferred_id
        assert feedback.rating is None

    def test_valid_feedback_with_tags(self):
        """Test creating feedback with tags only."""
        audio_id = uuid4()
        feedback = FeedbackCreate(
            audio_id=audio_id,
            tags=["melodic", "calm"],
        )
        assert feedback.audio_id == audio_id
        assert feedback.tags == ["melodic", "calm"]

    def test_valid_feedback_with_all_fields(self):
        """Test creating feedback with all fields."""
        audio_id = uuid4()
        preferred_id = uuid4()
        feedback = FeedbackCreate(
            audio_id=audio_id,
            rating=5.0,
            rating_criterion="melody",
            preferred_over=preferred_id,
            tags=["excellent"],
            notes="Amazing composition",
        )
        assert feedback.rating == 5.0
        assert feedback.rating_criterion == "melody"
        assert feedback.notes == "Amazing composition"

    def test_empty_feedback_raises_error(self):
        """Test that feedback without rating, preference, or tags raises error."""
        audio_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            FeedbackCreate(audio_id=audio_id)
        assert "Feedback must include rating, preference, or tags" in str(
            exc_info.value
        )

    def test_rating_min_boundary(self):
        """Test rating minimum boundary (1)."""
        audio_id = uuid4()
        feedback = FeedbackCreate(audio_id=audio_id, rating=1.0)
        assert feedback.rating == 1.0

    def test_rating_max_boundary(self):
        """Test rating maximum boundary (5)."""
        audio_id = uuid4()
        feedback = FeedbackCreate(audio_id=audio_id, rating=5.0)
        assert feedback.rating == 5.0

    def test_rating_below_min_raises_error(self):
        """Test that rating below 1 raises ValidationError."""
        audio_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            FeedbackCreate(audio_id=audio_id, rating=0.5)
        assert "rating" in str(exc_info.value)

    def test_rating_above_max_raises_error(self):
        """Test that rating above 5 raises ValidationError."""
        audio_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            FeedbackCreate(audio_id=audio_id, rating=5.5)
        assert "rating" in str(exc_info.value)

    def test_default_rating_criterion(self):
        """Test that rating_criterion defaults to 'overall'."""
        audio_id = uuid4()
        feedback = FeedbackCreate(audio_id=audio_id, rating=4.0)
        assert feedback.rating_criterion == "overall"

    def test_empty_tags_does_not_satisfy_requirement(self):
        """Test that empty tags list does not satisfy feedback requirement."""
        audio_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            FeedbackCreate(audio_id=audio_id, tags=[])
        assert "Feedback must include rating, preference, or tags" in str(
            exc_info.value
        )


class TestFeedbackResponse:
    """Tests for FeedbackResponse schema."""

    def test_valid_response(self):
        """Test creating a valid feedback response."""
        from datetime import datetime

        feedback_id = uuid4()
        audio_id = uuid4()
        response = FeedbackResponse(
            id=feedback_id,
            audio_id=audio_id,
            user_id=None,
            rating=4.5,
            rating_criterion="overall",
            preferred_over=None,
            tags=["melodic"],
            notes="Great",
            created_at=datetime.utcnow(),
        )
        assert response.id == feedback_id
        assert response.audio_id == audio_id
        assert response.rating == 4.5


class TestFeedbackListResponse:
    """Tests for FeedbackListResponse schema."""

    def test_valid_list_response(self):
        """Test creating a valid list response."""
        response = FeedbackListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0


class TestFeedbackStatsResponse:
    """Tests for FeedbackStatsResponse schema."""

    def test_valid_stats_response(self):
        """Test creating a valid stats response."""
        audio_id = uuid4()
        response = FeedbackStatsResponse(
            audio_id=audio_id,
            adapter_id=None,
            average_rating=4.2,
            rating_count=10,
            preference_wins=5,
            preference_losses=3,
            win_rate=0.625,
            common_tags=[{"tag": "melodic", "count": 5}],
        )
        assert response.audio_id == audio_id
        assert response.average_rating == 4.2
        assert response.win_rate == 0.625

    def test_stats_with_no_ratings(self):
        """Test stats response with no ratings."""
        response = FeedbackStatsResponse(
            average_rating=None,
            rating_count=0,
            preference_wins=0,
            preference_losses=0,
            win_rate=None,
            common_tags=[],
        )
        assert response.average_rating is None
        assert response.win_rate is None


class TestFeedbackSummaryResponse:
    """Tests for FeedbackSummaryResponse schema."""

    def test_valid_summary_response(self):
        """Test creating a valid summary response."""
        response = FeedbackSummaryResponse(
            total_feedback=100,
            total_ratings=80,
            total_preferences=20,
            rating_distribution={"1": 5, "2": 10, "3": 20, "4": 30, "5": 15},
            high_rated_samples=45,
        )
        assert response.total_feedback == 100
        assert response.total_ratings == 80
        assert response.rating_distribution["4"] == 30
