"""Tests for preference pair schema validation."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.preference_pair import (
    PreferencePairCreate,
    PreferencePairListResponse,
    PreferencePairResponse,
    PreferencePairStats,
    PreferencePairWithDetails,
)


class TestPreferencePairCreate:
    """Tests for PreferencePairCreate schema."""

    def test_valid_creation(self):
        """Test creating valid preference pair."""
        prompt_id = uuid4()
        chosen_id = uuid4()
        rejected_id = uuid4()

        pair = PreferencePairCreate(
            prompt_id=prompt_id,
            chosen_audio_id=chosen_id,
            rejected_audio_id=rejected_id,
        )

        assert pair.prompt_id == prompt_id
        assert pair.chosen_audio_id == chosen_id
        assert pair.rejected_audio_id == rejected_id
        assert pair.margin is None
        assert pair.notes is None

    def test_valid_creation_with_margin(self):
        """Test creating preference pair with margin."""
        pair = PreferencePairCreate(
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            margin=3.5,
        )

        assert pair.margin == 3.5

    def test_valid_creation_with_notes(self):
        """Test creating preference pair with notes."""
        pair = PreferencePairCreate(
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            notes="The melody is much better in the chosen sample",
        )

        assert pair.notes == "The melody is much better in the chosen sample"

    def test_margin_min_boundary(self):
        """Test margin minimum boundary (1)."""
        pair = PreferencePairCreate(
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            margin=1,
        )

        assert pair.margin == 1

    def test_margin_max_boundary(self):
        """Test margin maximum boundary (5)."""
        pair = PreferencePairCreate(
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            margin=5,
        )

        assert pair.margin == 5

    def test_margin_below_min_raises_error(self):
        """Test that margin below 1 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PreferencePairCreate(
                prompt_id=uuid4(),
                chosen_audio_id=uuid4(),
                rejected_audio_id=uuid4(),
                margin=0.5,
            )
        assert "margin" in str(exc_info.value).lower()

    def test_margin_above_max_raises_error(self):
        """Test that margin above 5 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PreferencePairCreate(
                prompt_id=uuid4(),
                chosen_audio_id=uuid4(),
                rejected_audio_id=uuid4(),
                margin=6,
            )
        assert "margin" in str(exc_info.value).lower()

    def test_same_audio_ids_raises_error(self):
        """Test that same chosen and rejected audio IDs raises error."""
        same_id = uuid4()

        with pytest.raises(ValidationError) as exc_info:
            PreferencePairCreate(
                prompt_id=uuid4(),
                chosen_audio_id=same_id,
                rejected_audio_id=same_id,
            )
        assert "different" in str(exc_info.value).lower()

    def test_missing_prompt_id_raises_error(self):
        """Test that missing prompt_id raises error."""
        with pytest.raises(ValidationError):
            PreferencePairCreate(
                chosen_audio_id=uuid4(),
                rejected_audio_id=uuid4(),
            )

    def test_missing_chosen_audio_id_raises_error(self):
        """Test that missing chosen_audio_id raises error."""
        with pytest.raises(ValidationError):
            PreferencePairCreate(
                prompt_id=uuid4(),
                rejected_audio_id=uuid4(),
            )

    def test_missing_rejected_audio_id_raises_error(self):
        """Test that missing rejected_audio_id raises error."""
        with pytest.raises(ValidationError):
            PreferencePairCreate(
                prompt_id=uuid4(),
                chosen_audio_id=uuid4(),
            )


class TestPreferencePairResponse:
    """Tests for PreferencePairResponse schema."""

    def test_valid_response(self):
        """Test creating valid response."""
        response = PreferencePairResponse(
            id=uuid4(),
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            user_id=None,
            margin=None,
            notes=None,
            created_at=datetime.utcnow(),
        )

        assert response.id is not None
        assert response.prompt_id is not None

    def test_response_with_all_fields(self):
        """Test response with all optional fields."""
        response = PreferencePairResponse(
            id=uuid4(),
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            user_id=uuid4(),
            margin=4.0,
            notes="Test notes",
            created_at=datetime.utcnow(),
        )

        assert response.user_id is not None
        assert response.margin == 4.0
        assert response.notes == "Test notes"


class TestPreferencePairWithDetails:
    """Tests for PreferencePairWithDetails schema."""

    def test_with_details(self):
        """Test response with additional details."""
        response = PreferencePairWithDetails(
            id=uuid4(),
            prompt_id=uuid4(),
            chosen_audio_id=uuid4(),
            rejected_audio_id=uuid4(),
            user_id=None,
            margin=None,
            notes=None,
            created_at=datetime.utcnow(),
            prompt_text="A calm piano melody",
            chosen_audio_path="/audio/chosen.wav",
            rejected_audio_path="/audio/rejected.wav",
        )

        assert response.prompt_text == "A calm piano melody"
        assert response.chosen_audio_path == "/audio/chosen.wav"
        assert response.rejected_audio_path == "/audio/rejected.wav"


class TestPreferencePairListResponse:
    """Tests for PreferencePairListResponse schema."""

    def test_list_response(self):
        """Test list response."""
        items = [
            PreferencePairResponse(
                id=uuid4(),
                prompt_id=uuid4(),
                chosen_audio_id=uuid4(),
                rejected_audio_id=uuid4(),
                user_id=None,
                margin=None,
                notes=None,
                created_at=datetime.utcnow(),
            )
        ]

        response = PreferencePairListResponse(
            items=items,
            total=1,
        )

        assert len(response.items) == 1
        assert response.total == 1


class TestPreferencePairStats:
    """Tests for PreferencePairStats schema."""

    def test_stats_basic(self):
        """Test basic stats."""
        stats = PreferencePairStats(
            total_pairs=100,
            unique_prompts=50,
            unique_audios=80,
            average_margin=None,
        )

        assert stats.total_pairs == 100
        assert stats.unique_prompts == 50
        assert stats.unique_audios == 80
        assert stats.average_margin is None

    def test_stats_with_margin(self):
        """Test stats with average margin."""
        stats = PreferencePairStats(
            total_pairs=100,
            unique_prompts=50,
            unique_audios=80,
            average_margin=3.5,
        )

        assert stats.average_margin == 3.5

    def test_stats_with_win_rates(self):
        """Test stats with audio win rates."""
        stats = PreferencePairStats(
            total_pairs=100,
            unique_prompts=50,
            unique_audios=80,
            average_margin=3.5,
            audio_win_rates={"audio1": 0.75, "audio2": 0.25},
        )

        assert stats.audio_win_rates is not None
        assert stats.audio_win_rates["audio1"] == 0.75
