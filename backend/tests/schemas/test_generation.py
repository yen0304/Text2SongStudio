"""Tests for generation schema validation."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.generation import (
    GenerationJobResponse,
    GenerationRequest,
    JobFeedbackResponse,
    SampleFeedbackGroup,
    SampleFeedbackItem,
)


class TestGenerationRequest:
    """Tests for GenerationRequest schema."""

    def test_valid_generation_request(self):
        """Test creating a valid generation request."""
        prompt_id = uuid4()
        request = GenerationRequest(
            prompt_id=prompt_id,
            num_samples=2,
            temperature=1.0,
            top_k=250,
            top_p=0.0,
            duration=10,
        )
        assert request.prompt_id == prompt_id
        assert request.num_samples == 2
        assert request.temperature == 1.0

    def test_minimal_generation_request(self):
        """Test creating request with minimal fields."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id)
        assert request.num_samples == 1  # default
        assert request.temperature == 1.0  # default
        assert request.top_k == 250  # default
        assert request.top_p == 0.0  # default
        assert request.adapter_id is None
        assert request.seed is None

    def test_num_samples_min_boundary(self):
        """Test num_samples minimum boundary (1)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, num_samples=1)
        assert request.num_samples == 1

    def test_num_samples_max_boundary(self):
        """Test num_samples maximum boundary (4)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, num_samples=4)
        assert request.num_samples == 4

    def test_num_samples_below_min_raises_error(self):
        """Test that num_samples below 1 raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, num_samples=0)
        assert "num_samples" in str(exc_info.value)

    def test_num_samples_above_max_raises_error(self):
        """Test that num_samples above 4 raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, num_samples=5)
        assert "num_samples" in str(exc_info.value)

    def test_temperature_min_boundary(self):
        """Test temperature minimum boundary (0.1)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, temperature=0.1)
        assert request.temperature == 0.1

    def test_temperature_max_boundary(self):
        """Test temperature maximum boundary (2.0)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, temperature=2.0)
        assert request.temperature == 2.0

    def test_temperature_below_min_raises_error(self):
        """Test that temperature below 0.1 raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, temperature=0.05)
        assert "temperature" in str(exc_info.value)

    def test_temperature_above_max_raises_error(self):
        """Test that temperature above 2.0 raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, temperature=2.5)
        assert "temperature" in str(exc_info.value)

    def test_top_k_min_boundary(self):
        """Test top_k minimum boundary (1)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, top_k=1)
        assert request.top_k == 1

    def test_top_k_max_boundary(self):
        """Test top_k maximum boundary (1000)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, top_k=1000)
        assert request.top_k == 1000

    def test_top_k_out_of_range_raises_error(self):
        """Test that top_k out of range raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, top_k=0)
        assert "top_k" in str(exc_info.value)

    def test_top_p_min_boundary(self):
        """Test top_p minimum boundary (0.0)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, top_p=0.0)
        assert request.top_p == 0.0

    def test_top_p_max_boundary(self):
        """Test top_p maximum boundary (1.0)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, top_p=1.0)
        assert request.top_p == 1.0

    def test_top_p_out_of_range_raises_error(self):
        """Test that top_p out of range raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, top_p=1.5)
        assert "top_p" in str(exc_info.value)

    def test_duration_min_boundary(self):
        """Test duration minimum boundary (1)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, duration=1)
        assert request.duration == 1

    def test_duration_max_boundary(self):
        """Test duration maximum boundary (30)."""
        prompt_id = uuid4()
        request = GenerationRequest(prompt_id=prompt_id, duration=30)
        assert request.duration == 30

    def test_duration_out_of_range_raises_error(self):
        """Test that duration out of range raises ValidationError."""
        prompt_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            GenerationRequest(prompt_id=prompt_id, duration=31)
        assert "duration" in str(exc_info.value)

    def test_request_with_adapter_id(self):
        """Test request with adapter_id."""
        prompt_id = uuid4()
        adapter_id = uuid4()
        request = GenerationRequest(
            prompt_id=prompt_id,
            adapter_id=adapter_id,
        )
        assert request.adapter_id == adapter_id

    def test_request_with_seed(self):
        """Test request with seed for reproducibility."""
        prompt_id = uuid4()
        request = GenerationRequest(
            prompt_id=prompt_id,
            seed=42,
        )
        assert request.seed == 42


class TestGenerationJobResponse:
    """Tests for GenerationJobResponse schema."""

    def test_valid_job_response(self):
        """Test creating a valid job response."""
        job_id = uuid4()
        audio_ids = [uuid4(), uuid4()]
        response = GenerationJobResponse(
            id=job_id,
            status="completed",
            progress=1.0,
            audio_ids=audio_ids,
            error=None,
            created_at=datetime.utcnow(),
        )
        assert response.id == job_id
        assert response.status == "completed"
        assert len(response.audio_ids) == 2

    def test_queued_job_response(self):
        """Test job response for queued status."""
        job_id = uuid4()
        response = GenerationJobResponse(
            id=job_id,
            status="queued",
            progress=None,
            audio_ids=None,
            created_at=datetime.utcnow(),
        )
        assert response.status == "queued"
        assert response.progress is None
        assert response.audio_ids is None

    def test_failed_job_response(self):
        """Test job response for failed status."""
        job_id = uuid4()
        response = GenerationJobResponse(
            id=job_id,
            status="failed",
            error="Generation failed due to resource constraint",
            created_at=datetime.utcnow(),
        )
        assert response.status == "failed"
        assert response.error is not None


class TestSampleFeedbackItem:
    """Tests for SampleFeedbackItem schema."""

    def test_valid_feedback_item(self):
        """Test creating a valid feedback item."""
        feedback_id = uuid4()
        item = SampleFeedbackItem(
            id=feedback_id,
            rating=4.5,
            rating_criterion="overall",
            preferred_over=None,
            tags=["melodic"],
            notes="Great composition",
            created_at=datetime.utcnow(),
        )
        assert item.id == feedback_id
        assert item.rating == 4.5

    def test_feedback_item_with_preference(self):
        """Test feedback item with preference."""
        feedback_id = uuid4()
        preferred_id = uuid4()
        item = SampleFeedbackItem(
            id=feedback_id,
            rating=None,
            rating_criterion=None,
            preferred_over=preferred_id,
            tags=None,
            notes=None,
            created_at=datetime.utcnow(),
        )
        assert item.preferred_over == preferred_id


class TestSampleFeedbackGroup:
    """Tests for SampleFeedbackGroup schema."""

    def test_valid_feedback_group(self):
        """Test creating a valid feedback group."""
        audio_id = uuid4()
        group = SampleFeedbackGroup(
            audio_id=audio_id,
            label="A",
            feedback=[],
            average_rating=4.2,
            feedback_count=5,
        )
        assert group.audio_id == audio_id
        assert group.label == "A"
        assert group.average_rating == 4.2

    def test_feedback_group_defaults(self):
        """Test feedback group with defaults."""
        audio_id = uuid4()
        group = SampleFeedbackGroup(
            audio_id=audio_id,
            label="B",
            feedback=[],
        )
        assert group.average_rating is None
        assert group.feedback_count == 0


class TestJobFeedbackResponse:
    """Tests for JobFeedbackResponse schema."""

    def test_valid_job_feedback_response(self):
        """Test creating a valid job feedback response."""
        job_id = uuid4()
        prompt_id = uuid4()
        response = JobFeedbackResponse(
            job_id=job_id,
            prompt_id=prompt_id,
            total_samples=4,
            total_feedback=10,
            average_rating=4.0,
            samples=[],
        )
        assert response.job_id == job_id
        assert response.total_samples == 4
        assert response.total_feedback == 10

    def test_job_feedback_response_no_feedback(self):
        """Test job feedback response with no feedback."""
        job_id = uuid4()
        prompt_id = uuid4()
        response = JobFeedbackResponse(
            job_id=job_id,
            prompt_id=prompt_id,
            total_samples=2,
            total_feedback=0,
            average_rating=None,
            samples=[],
        )
        assert response.total_feedback == 0
        assert response.average_rating is None
