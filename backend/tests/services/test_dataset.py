"""Tests for dataset service."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.dataset import DatasetType
from app.schemas.dataset import DatasetFilterQuery


class TestDatasetServiceFilterBuilding:
    """Tests for DatasetService filter building logic."""

    @pytest.fixture
    def dataset_service(self):
        """Create a DatasetService with mocked dependencies."""
        mock_db = AsyncMock()

        with patch("app.services.dataset.StorageService"):
            from app.services.dataset import DatasetService

            service = DatasetService(mock_db)
            service._mock_db = mock_db
            yield service

    def test_build_filter_query_empty(self, dataset_service):
        """Test building filter query with no filters."""
        conditions = dataset_service._build_filter_query(None)
        assert conditions == []

    def test_build_filter_query_min_rating(self, dataset_service):
        """Test building filter query with min_rating."""
        filter_query = DatasetFilterQuery(min_rating=3.0)
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 1

    def test_build_filter_query_max_rating(self, dataset_service):
        """Test building filter query with max_rating."""
        filter_query = DatasetFilterQuery(max_rating=5.0)
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 1

    def test_build_filter_query_rating_range(self, dataset_service):
        """Test building filter query with rating range."""
        filter_query = DatasetFilterQuery(min_rating=3.0, max_rating=5.0)
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 2

    def test_build_filter_query_required_tags(self, dataset_service):
        """Test building filter query with required tags."""
        filter_query = DatasetFilterQuery(required_tags=["melodic", "calm"])
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 1

    def test_build_filter_query_excluded_tags(self, dataset_service):
        """Test building filter query with excluded tags."""
        filter_query = DatasetFilterQuery(excluded_tags=["noisy", "distorted"])
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 2  # One condition per excluded tag

    def test_build_filter_query_adapter_id(self, dataset_service):
        """Test building filter query with adapter_id."""
        adapter_id = uuid4()
        filter_query = DatasetFilterQuery(adapter_id=adapter_id)
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 1

    def test_build_filter_query_user_id(self, dataset_service):
        """Test building filter query with user_id."""
        user_id = uuid4()
        filter_query = DatasetFilterQuery(user_id=user_id)
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 1

    def test_build_filter_query_date_range(self, dataset_service):
        """Test building filter query with date range."""
        filter_query = DatasetFilterQuery(
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 12, 31),
        )
        conditions = dataset_service._build_filter_query(filter_query)
        assert len(conditions) == 2

    def test_build_filter_query_all_filters(self, dataset_service):
        """Test building filter query with all filters."""
        filter_query = DatasetFilterQuery(
            min_rating=3.0,
            max_rating=5.0,
            required_tags=["melodic"],
            excluded_tags=["noisy"],
            adapter_id=uuid4(),
            user_id=uuid4(),
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 12, 31),
        )
        conditions = dataset_service._build_filter_query(filter_query)
        # min_rating + max_rating + required_tags + excluded_tag + adapter_id + user_id + start_date + end_date
        assert len(conditions) == 8


class TestDatasetServiceCountSamples:
    """Tests for DatasetService count_samples method."""

    @pytest.fixture
    def dataset_service(self):
        """Create a DatasetService with mocked dependencies."""
        mock_db = AsyncMock()

        with patch("app.services.dataset.StorageService"):
            from app.services.dataset import DatasetService

            service = DatasetService(mock_db)
            service._mock_db = mock_db
            yield service

    @pytest.mark.asyncio
    async def test_count_samples_supervised(self, dataset_service):
        """Test counting supervised samples."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 100
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        count = await dataset_service.count_samples(DatasetType.SUPERVISED, None)

        assert count == 100

    @pytest.mark.asyncio
    async def test_count_samples_preference(self, dataset_service):
        """Test counting preference samples."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 50
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        count = await dataset_service.count_samples(DatasetType.PREFERENCE, None)

        assert count == 50

    @pytest.mark.asyncio
    async def test_count_samples_with_filter(self, dataset_service):
        """Test counting samples with filter."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 30
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        filter_query = DatasetFilterQuery(min_rating=4.0)
        count = await dataset_service.count_samples(
            DatasetType.SUPERVISED, filter_query
        )

        assert count == 30

    @pytest.mark.asyncio
    async def test_count_samples_returns_zero_when_none(self, dataset_service):
        """Test counting samples returns 0 when result is None."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = None
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        count = await dataset_service.count_samples(DatasetType.SUPERVISED, None)

        assert count == 0


class TestDatasetServiceGetSamples:
    """Tests for DatasetService get samples methods."""

    @pytest.fixture
    def dataset_service(self):
        """Create a DatasetService with mocked dependencies."""
        mock_db = AsyncMock()

        with patch("app.services.dataset.StorageService"):
            from app.services.dataset import DatasetService

            service = DatasetService(mock_db)
            service._mock_db = mock_db
            yield service

    @pytest.mark.asyncio
    async def test_get_supervised_samples(self, dataset_service):
        """Test getting supervised samples."""
        mock_samples = [
            (MagicMock(), MagicMock(), MagicMock()),
            (MagicMock(), MagicMock(), MagicMock()),
        ]
        mock_result = MagicMock()
        mock_result.all.return_value = mock_samples
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        samples = await dataset_service.get_supervised_samples(None)

        assert len(samples) == 2

    @pytest.mark.asyncio
    async def test_get_supervised_samples_with_filter(self, dataset_service):
        """Test getting supervised samples with filter."""
        mock_result = MagicMock()
        mock_result.all.return_value = []
        dataset_service._mock_db.execute = AsyncMock(return_value=mock_result)

        filter_query = DatasetFilterQuery(min_rating=4.0)
        samples = await dataset_service.get_supervised_samples(filter_query)

        assert samples == []
