"""Tests for prompt schema validation."""

import pytest
from pydantic import ValidationError

from app.schemas.prompt import (
    ALLOWED_INSTRUMENTS,
    PromptAttributes,
    PromptCreate,
    PromptListResponse,
    PromptResponse,
)


class TestPromptAttributes:
    """Tests for PromptAttributes schema."""

    def test_valid_attributes(self):
        """Test creating valid prompt attributes."""
        attrs = PromptAttributes(
            style="classical",
            tempo=80,
            primary_instruments=["acoustic-piano"],
            secondary_instruments=["violin"],
            mood="calm",
            duration=10,
        )
        assert attrs.style == "classical"
        assert attrs.tempo == 80
        assert attrs.primary_instruments == ["acoustic-piano"]
        assert attrs.secondary_instruments == ["violin"]
        assert attrs.mood == "calm"
        assert attrs.duration == 10

    def test_optional_fields(self):
        """Test that all fields are optional."""
        attrs = PromptAttributes()
        assert attrs.style is None
        assert attrs.tempo is None
        assert attrs.primary_instruments is None
        assert attrs.secondary_instruments is None
        assert attrs.mood is None
        assert attrs.duration is None

    def test_tempo_min_boundary(self):
        """Test tempo minimum boundary (40)."""
        attrs = PromptAttributes(tempo=40)
        assert attrs.tempo == 40

    def test_tempo_max_boundary(self):
        """Test tempo maximum boundary (200)."""
        attrs = PromptAttributes(tempo=200)
        assert attrs.tempo == 200

    def test_tempo_below_min_raises_error(self):
        """Test that tempo below 40 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(tempo=39)
        assert "tempo" in str(exc_info.value)

    def test_tempo_above_max_raises_error(self):
        """Test that tempo above 200 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(tempo=201)
        assert "tempo" in str(exc_info.value)

    def test_duration_min_boundary(self):
        """Test duration minimum boundary (1)."""
        attrs = PromptAttributes(duration=1)
        assert attrs.duration == 1

    def test_duration_max_boundary(self):
        """Test duration maximum boundary (30)."""
        attrs = PromptAttributes(duration=30)
        assert attrs.duration == 30

    def test_duration_below_min_raises_error(self):
        """Test that duration below 1 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(duration=0)
        assert "duration" in str(exc_info.value)

    def test_duration_above_max_raises_error(self):
        """Test that duration above 30 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(duration=31)
        assert "duration" in str(exc_info.value)

    def test_valid_primary_instruments(self):
        """Test valid instrument names are accepted."""
        attrs = PromptAttributes(
            primary_instruments=["acoustic-piano", "violin", "acoustic-guitar"]
        )
        assert len(attrs.primary_instruments) == 3

    def test_invalid_primary_instrument_raises_error(self):
        """Test that invalid instrument name raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(primary_instruments=["invalid-instrument"])
        assert "Invalid instruments" in str(exc_info.value)

    def test_invalid_secondary_instrument_raises_error(self):
        """Test that invalid secondary instrument raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptAttributes(secondary_instruments=["not-an-instrument"])
        assert "Invalid instruments" in str(exc_info.value)

    def test_all_allowed_instruments_are_valid(self):
        """Test that all instruments in ALLOWED_INSTRUMENTS are accepted."""
        for instrument in ALLOWED_INSTRUMENTS:
            attrs = PromptAttributes(primary_instruments=[instrument])
            assert instrument in attrs.primary_instruments


class TestPromptCreate:
    """Tests for PromptCreate schema."""

    def test_valid_prompt_create(self):
        """Test creating a valid prompt."""
        prompt = PromptCreate(
            text="A calm piano melody",
            attributes=PromptAttributes(style="classical"),
        )
        assert prompt.text == "A calm piano melody"
        assert prompt.attributes.style == "classical"

    def test_text_whitespace_stripped(self):
        """Test that text whitespace is stripped."""
        prompt = PromptCreate(text="  Hello World  ")
        assert prompt.text == "Hello World"

    def test_attributes_optional(self):
        """Test that attributes are optional."""
        prompt = PromptCreate(text="Simple prompt")
        assert prompt.attributes is None

    def test_empty_text_raises_error(self):
        """Test that empty text raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            PromptCreate(text="")
        assert "text" in str(exc_info.value)

    def test_text_max_length(self):
        """Test text maximum length (2000 characters)."""
        long_text = "a" * 2000
        prompt = PromptCreate(text=long_text)
        assert len(prompt.text) == 2000

    def test_text_exceeds_max_length_raises_error(self):
        """Test that text exceeding 2000 characters raises ValidationError."""
        long_text = "a" * 2001
        with pytest.raises(ValidationError) as exc_info:
            PromptCreate(text=long_text)
        assert "text" in str(exc_info.value)


class TestPromptResponse:
    """Tests for PromptResponse schema."""

    def test_valid_response(self):
        """Test creating a valid prompt response."""
        from datetime import datetime
        from uuid import uuid4

        prompt_id = uuid4()
        response = PromptResponse(
            id=prompt_id,
            text="Test prompt",
            attributes={"style": "classical"},
            created_at=datetime.utcnow(),
            audio_sample_ids=[],
        )
        assert response.id == prompt_id
        assert response.text == "Test prompt"
        assert response.attributes == {"style": "classical"}

    def test_audio_sample_ids_default(self):
        """Test that audio_sample_ids defaults to empty list."""
        from datetime import datetime
        from uuid import uuid4

        response = PromptResponse(
            id=uuid4(),
            text="Test",
            attributes=None,
            created_at=datetime.utcnow(),
        )
        assert response.audio_sample_ids == []


class TestPromptListResponse:
    """Tests for PromptListResponse schema."""

    def test_valid_list_response(self):
        """Test creating a valid list response."""
        response = PromptListResponse(
            items=[],
            total=0,
            page=1,
            limit=20,
        )
        assert response.items == []
        assert response.total == 0
        assert response.page == 1
        assert response.limit == 20
