"""Tests for favorite schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.favorite import FavoriteCreate, FavoriteResponse, TargetType


class TestFavoriteCreate:
    """Tests for FavoriteCreate schema."""

    def test_valid_favorite_create_prompt(self):
        """Test creating a valid favorite for prompt."""
        data = FavoriteCreate(
            target_type=TargetType.PROMPT,
            target_id="550e8400-e29b-41d4-a716-446655440000",
        )
        assert data.target_type == TargetType.PROMPT
        assert str(data.target_id) == "550e8400-e29b-41d4-a716-446655440000"
        assert data.note is None

    def test_valid_favorite_create_audio(self):
        """Test creating a valid favorite for audio."""
        data = FavoriteCreate(
            target_type=TargetType.AUDIO,
            target_id="550e8400-e29b-41d4-a716-446655440001",
            note="Great sample!",
        )
        assert data.target_type == TargetType.AUDIO
        assert data.note == "Great sample!"

    def test_valid_favorite_create_string_target_type(self):
        """Test creating favorite with string target_type."""
        data = FavoriteCreate(
            target_type="prompt",
            target_id="550e8400-e29b-41d4-a716-446655440000",
        )
        assert data.target_type == TargetType.PROMPT

    def test_invalid_target_type(self):
        """Test that invalid target_type is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            FavoriteCreate(
                target_type="invalid",
                target_id="550e8400-e29b-41d4-a716-446655440000",
            )
        assert "target_type" in str(exc_info.value).lower()

    def test_note_too_long(self):
        """Test that note exceeding 500 chars is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            FavoriteCreate(
                target_type=TargetType.PROMPT,
                target_id="550e8400-e29b-41d4-a716-446655440000",
                note="x" * 501,
            )
        assert "string_too_long" in str(exc_info.value)


class TestFavoriteResponse:
    """Tests for FavoriteResponse schema."""

    def test_favorite_response_from_dict(self):
        """Test creating response from dict."""
        from datetime import datetime
        from uuid import uuid4

        fav_id = uuid4()
        target_id = uuid4()
        user_id = uuid4()
        now = datetime.utcnow()

        data = FavoriteResponse(
            id=fav_id,
            target_type="prompt",
            target_id=target_id,
            user_id=user_id,
            note="My favorite",
            created_at=now,
        )
        assert data.id == fav_id
        assert data.target_type == "prompt"
        assert data.target_id == target_id
        assert data.user_id == user_id
        assert data.note == "My favorite"
        assert data.created_at == now

    def test_favorite_response_no_user(self):
        """Test response without user_id."""
        from datetime import datetime
        from uuid import uuid4

        data = FavoriteResponse(
            id=uuid4(),
            target_type="audio",
            target_id=uuid4(),
            user_id=None,
            note=None,
            created_at=datetime.utcnow(),
        )
        assert data.user_id is None
        assert data.note is None
