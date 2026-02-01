"""Tests for template schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.prompt import PromptAttributes
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateUpdate


class TestTemplateCreate:
    """Tests for TemplateCreate schema."""

    def test_valid_template_create(self):
        """Test creating a valid template."""
        data = TemplateCreate(
            name="Test Template",
            text="Create a happy electronic song",
            description="A test template",
            category="electronic",
        )
        assert data.name == "Test Template"
        assert data.text == "Create a happy electronic song"
        assert data.description == "A test template"
        assert data.category == "electronic"

    def test_template_create_minimal(self):
        """Test creating a template with only required fields."""
        data = TemplateCreate(
            name="Test",
            text="Prompt text",
        )
        assert data.name == "Test"
        assert data.text == "Prompt text"
        assert data.description is None
        assert data.category is None
        assert data.attributes is None

    def test_template_create_with_attributes(self):
        """Test creating a template with attributes."""
        data = TemplateCreate(
            name="Jazz Template",
            text="Smooth jazz with piano",
            attributes=PromptAttributes(style="jazz", tempo=90),
        )
        assert data.attributes is not None
        assert data.attributes.style == "jazz"
        assert data.attributes.tempo == 90

    def test_template_create_name_too_short(self):
        """Test that empty name is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(name="", text="Prompt text")
        assert "string_too_short" in str(exc_info.value)

    def test_template_create_name_too_long(self):
        """Test that name exceeding 100 chars is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(name="x" * 101, text="Prompt text")
        assert "string_too_long" in str(exc_info.value)

    def test_template_create_text_too_short(self):
        """Test that empty text is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(name="Test", text="")
        assert "string_too_short" in str(exc_info.value)

    def test_template_create_text_too_long(self):
        """Test that text exceeding 2000 chars is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(name="Test", text="x" * 2001)
        assert "string_too_long" in str(exc_info.value)

    def test_template_create_category_too_long(self):
        """Test that category exceeding 50 chars is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(name="Test", text="Prompt", category="x" * 51)
        assert "string_too_long" in str(exc_info.value)


class TestTemplateUpdate:
    """Tests for TemplateUpdate schema."""

    def test_template_update_all_fields(self):
        """Test updating all fields."""
        data = TemplateUpdate(
            name="Updated Name",
            text="Updated text",
            description="Updated desc",
            category="updated",
        )
        assert data.name == "Updated Name"
        assert data.text == "Updated text"

    def test_template_update_partial(self):
        """Test partial update."""
        data = TemplateUpdate(name="Only name")
        assert data.name == "Only name"
        assert data.text is None
        assert data.description is None

    def test_template_update_empty(self):
        """Test empty update is valid."""
        data = TemplateUpdate()
        assert data.name is None
        assert data.text is None


class TestTemplateResponse:
    """Tests for TemplateResponse schema."""

    def test_template_response_from_dict(self):
        """Test creating response from dict."""
        from datetime import datetime
        from uuid import uuid4

        template_id = uuid4()
        now = datetime.utcnow()

        data = TemplateResponse(
            id=template_id,
            name="Test Template",
            description="Description",
            text="Prompt text",
            attributes={"style": "electronic"},
            category="electronic",
            is_system=False,
            user_id=None,
            created_at=now,
            updated_at=now,
        )
        assert data.id == template_id
        assert data.name == "Test Template"
        assert data.is_system is False

    def test_template_response_system_template(self):
        """Test system template response."""
        from datetime import datetime
        from uuid import uuid4

        data = TemplateResponse(
            id=uuid4(),
            name="System Template",
            description=None,
            text="System prompt",
            attributes=None,
            category="default",
            is_system=True,
            user_id=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        assert data.is_system is True
        assert data.user_id is None
