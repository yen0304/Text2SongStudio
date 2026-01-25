"""Tests for dataset schema validation."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.dataset import DatasetType
from app.schemas.dataset import (
    DatasetCreate,
    DatasetExportRequest,
    DatasetExportResponse,
    DatasetFilterQuery,
    DatasetListResponse,
    DatasetPreviewRequest,
    DatasetPreviewResponse,
    DatasetResponse,
    DatasetStatsResponse,
)


class TestDatasetFilterQuery:
    """Tests for DatasetFilterQuery schema."""

    def test_valid_filter_query(self):
        """Test creating a valid filter query."""
        query = DatasetFilterQuery(
            min_rating=3.0,
            max_rating=5.0,
            required_tags=["melodic"],
            excluded_tags=["noisy"],
        )
        assert query.min_rating == 3.0
        assert query.max_rating == 5.0
        assert query.required_tags == ["melodic"]
        assert query.excluded_tags == ["noisy"]

    def test_empty_filter_query(self):
        """Test creating an empty filter query."""
        query = DatasetFilterQuery()
        assert query.min_rating is None
        assert query.max_rating is None
        assert query.required_tags is None
        assert query.excluded_tags is None

    def test_min_rating_boundary(self):
        """Test min_rating minimum boundary (1)."""
        query = DatasetFilterQuery(min_rating=1.0)
        assert query.min_rating == 1.0

    def test_max_rating_boundary(self):
        """Test max_rating maximum boundary (5)."""
        query = DatasetFilterQuery(max_rating=5.0)
        assert query.max_rating == 5.0

    def test_min_rating_below_boundary_raises_error(self):
        """Test that min_rating below 1 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            DatasetFilterQuery(min_rating=0.5)
        assert "min_rating" in str(exc_info.value)

    def test_max_rating_above_boundary_raises_error(self):
        """Test that max_rating above 5 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            DatasetFilterQuery(max_rating=5.5)
        assert "max_rating" in str(exc_info.value)

    def test_filter_with_adapter_id(self):
        """Test filter with adapter_id."""
        adapter_id = uuid4()
        query = DatasetFilterQuery(adapter_id=adapter_id)
        assert query.adapter_id == adapter_id

    def test_filter_with_user_id(self):
        """Test filter with user_id."""
        user_id = uuid4()
        query = DatasetFilterQuery(user_id=user_id)
        assert query.user_id == user_id

    def test_filter_with_date_range(self):
        """Test filter with date range."""
        start = datetime(2024, 1, 1)
        end = datetime(2024, 12, 31)
        query = DatasetFilterQuery(start_date=start, end_date=end)
        assert query.start_date == start
        assert query.end_date == end


class TestDatasetCreate:
    """Tests for DatasetCreate schema."""

    def test_valid_supervised_dataset_create(self):
        """Test creating a valid supervised dataset."""
        dataset = DatasetCreate(
            name="Training Dataset",
            description="Dataset for training",
            type=DatasetType.SUPERVISED,
        )
        assert dataset.name == "Training Dataset"
        assert dataset.type == DatasetType.SUPERVISED

    def test_valid_preference_dataset_create(self):
        """Test creating a valid preference dataset."""
        dataset = DatasetCreate(
            name="Preference Dataset",
            type=DatasetType.PREFERENCE,
        )
        assert dataset.type == DatasetType.PREFERENCE

    def test_name_min_length(self):
        """Test name minimum length (1)."""
        dataset = DatasetCreate(name="D", type=DatasetType.SUPERVISED)
        assert dataset.name == "D"

    def test_name_max_length(self):
        """Test name maximum length (200)."""
        long_name = "a" * 200
        dataset = DatasetCreate(name=long_name, type=DatasetType.SUPERVISED)
        assert len(dataset.name) == 200

    def test_empty_name_raises_error(self):
        """Test that empty name raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            DatasetCreate(name="", type=DatasetType.SUPERVISED)
        assert "name" in str(exc_info.value)

    def test_name_exceeds_max_length_raises_error(self):
        """Test that name exceeding 200 characters raises ValidationError."""
        long_name = "a" * 201
        with pytest.raises(ValidationError) as exc_info:
            DatasetCreate(name=long_name, type=DatasetType.SUPERVISED)
        assert "name" in str(exc_info.value)

    def test_dataset_with_filter_query(self):
        """Test dataset with filter query."""
        dataset = DatasetCreate(
            name="Filtered Dataset",
            type=DatasetType.SUPERVISED,
            filter_query=DatasetFilterQuery(min_rating=4.0),
        )
        assert dataset.filter_query.min_rating == 4.0


class TestDatasetResponse:
    """Tests for DatasetResponse schema."""

    def test_valid_dataset_response(self):
        """Test creating a valid dataset response."""
        dataset_id = uuid4()
        response = DatasetResponse(
            id=dataset_id,
            name="Test Dataset",
            description="Test description",
            type=DatasetType.SUPERVISED,
            filter_query={"min_rating": 3.0},
            sample_count=100,
            export_path="/data/dataset.json",
            created_at=datetime.utcnow(),
        )
        assert response.id == dataset_id
        assert response.sample_count == 100

    def test_dataset_response_without_export_path(self):
        """Test dataset response without export path."""
        dataset_id = uuid4()
        response = DatasetResponse(
            id=dataset_id,
            name="New Dataset",
            description=None,
            type=DatasetType.PREFERENCE,
            filter_query=None,
            sample_count=0,
            export_path=None,
            created_at=datetime.utcnow(),
        )
        assert response.export_path is None


class TestDatasetListResponse:
    """Tests for DatasetListResponse schema."""

    def test_valid_list_response(self):
        """Test creating a valid list response."""
        response = DatasetListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0


class TestDatasetPreviewRequest:
    """Tests for DatasetPreviewRequest schema."""

    def test_valid_preview_request(self):
        """Test creating a valid preview request."""
        request = DatasetPreviewRequest(
            type=DatasetType.SUPERVISED,
            filter_query=DatasetFilterQuery(min_rating=3.0),
        )
        assert request.type == DatasetType.SUPERVISED

    def test_preview_request_without_filter(self):
        """Test preview request without filter."""
        request = DatasetPreviewRequest(type=DatasetType.PREFERENCE)
        assert request.filter_query is None


class TestDatasetPreviewResponse:
    """Tests for DatasetPreviewResponse schema."""

    def test_valid_preview_response(self):
        """Test creating a valid preview response."""
        response = DatasetPreviewResponse(count=50)
        assert response.count == 50


class TestDatasetExportRequest:
    """Tests for DatasetExportRequest schema."""

    def test_default_format(self):
        """Test default export format is huggingface."""
        request = DatasetExportRequest()
        assert request.format == "huggingface"

    def test_json_format(self):
        """Test JSON export format."""
        request = DatasetExportRequest(format="json")
        assert request.format == "json"

    def test_csv_format(self):
        """Test CSV export format."""
        request = DatasetExportRequest(format="csv")
        assert request.format == "csv"

    def test_invalid_format_raises_error(self):
        """Test that invalid format raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            DatasetExportRequest(format="xml")
        assert "format" in str(exc_info.value)


class TestDatasetExportResponse:
    """Tests for DatasetExportResponse schema."""

    def test_valid_export_response(self):
        """Test creating a valid export response."""
        dataset_id = uuid4()
        response = DatasetExportResponse(
            dataset_id=dataset_id,
            export_path="/data/export/dataset.json",
            sample_count=100,
            format="json",
        )
        assert response.dataset_id == dataset_id
        assert response.sample_count == 100


class TestDatasetStatsResponse:
    """Tests for DatasetStatsResponse schema."""

    def test_valid_stats_response(self):
        """Test creating a valid stats response."""
        dataset_id = uuid4()
        response = DatasetStatsResponse(
            dataset_id=dataset_id,
            sample_count=100,
            rating_distribution={"1": 5, "2": 10, "3": 20, "4": 40, "5": 25},
            unique_prompts=50,
            unique_adapters=5,
            tag_frequency={"melodic": 30, "calm": 25},
            inter_rater_agreement=0.85,
            preference_consistency=0.9,
        )
        assert response.sample_count == 100
        assert response.inter_rater_agreement == 0.85

    def test_stats_without_agreement_metrics(self):
        """Test stats response without agreement metrics."""
        dataset_id = uuid4()
        response = DatasetStatsResponse(
            dataset_id=dataset_id,
            sample_count=10,
            rating_distribution={},
            unique_prompts=5,
            unique_adapters=1,
            tag_frequency={},
        )
        assert response.inter_rater_agreement is None
        assert response.preference_consistency is None
