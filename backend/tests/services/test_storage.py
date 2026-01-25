"""Tests for storage service."""

from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError


class TestStorageService:
    """Tests for StorageService class."""

    @pytest.fixture
    def storage_service(self):
        """Create a StorageService instance with mocked boto3."""
        with patch("app.services.storage.boto3") as mock_boto3:
            mock_client = MagicMock()
            mock_boto3.client.return_value = mock_client

            from app.services.storage import StorageService

            service = StorageService()
            service._mock_client = mock_client
            yield service

    def test_init_creates_s3_client(self):
        """Test that initialization creates S3 client."""
        with patch("app.services.storage.boto3") as mock_boto3:
            from app.services.storage import StorageService

            StorageService()
            mock_boto3.client.assert_called_once()

    @pytest.mark.asyncio
    async def test_ensure_bucket_exists_when_exists(self, storage_service):
        """Test ensure_bucket_exists when bucket already exists."""
        storage_service._mock_client.head_bucket.return_value = {}

        await storage_service.ensure_bucket_exists()

        storage_service._mock_client.head_bucket.assert_called_once()
        storage_service._mock_client.create_bucket.assert_not_called()

    @pytest.mark.asyncio
    async def test_ensure_bucket_exists_creates_when_missing(self, storage_service):
        """Test ensure_bucket_exists creates bucket when missing."""
        storage_service._mock_client.head_bucket.side_effect = ClientError(
            {"Error": {"Code": "404", "Message": "Not Found"}},
            "HeadBucket",
        )

        await storage_service.ensure_bucket_exists()

        storage_service._mock_client.create_bucket.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_file(self, storage_service):
        """Test uploading a file."""
        test_data = b"test audio data"
        test_key = "audio/test.wav"

        result = await storage_service.upload_file(test_key, test_data)

        storage_service._mock_client.put_object.assert_called_once()
        call_args = storage_service._mock_client.put_object.call_args
        assert call_args.kwargs["Key"] == test_key
        assert call_args.kwargs["Body"] == test_data
        assert "s3://" in result

    @pytest.mark.asyncio
    async def test_upload_file_with_content_type(self, storage_service):
        """Test uploading a file with custom content type."""
        test_data = b"test audio data"
        test_key = "audio/test.mp3"

        await storage_service.upload_file(test_key, test_data, content_type="audio/mp3")

        call_args = storage_service._mock_client.put_object.call_args
        assert call_args.kwargs["ContentType"] == "audio/mp3"

    @pytest.mark.asyncio
    async def test_download_file(self, storage_service):
        """Test downloading a file."""
        test_data = b"test audio data"
        mock_body = MagicMock()
        mock_body.read.return_value = test_data
        storage_service._mock_client.get_object.return_value = {"Body": mock_body}

        result = await storage_service.download_file("audio/test.wav")

        assert result == test_data

    @pytest.mark.asyncio
    async def test_delete_file(self, storage_service):
        """Test deleting a file."""
        test_key = "audio/test.wav"

        await storage_service.delete_file(test_key)

        storage_service._mock_client.delete_object.assert_called_once()
        call_args = storage_service._mock_client.delete_object.call_args
        assert call_args.kwargs["Key"] == test_key

    @pytest.mark.asyncio
    async def test_delete_file_with_s3_uri(self, storage_service):
        """Test deleting a file using full S3 URI."""
        full_uri = "s3://text2song-audio/audio/test.wav"

        await storage_service.delete_file(full_uri)

        call_args = storage_service._mock_client.delete_object.call_args
        assert call_args.kwargs["Key"] == "audio/test.wav"

    @pytest.mark.asyncio
    async def test_file_exists_returns_true(self, storage_service):
        """Test file_exists returns True when file exists."""
        storage_service._mock_client.head_object.return_value = {}

        result = await storage_service.file_exists("audio/test.wav")

        assert result is True

    @pytest.mark.asyncio
    async def test_file_exists_returns_false(self, storage_service):
        """Test file_exists returns False when file doesn't exist."""
        storage_service._mock_client.head_object.side_effect = ClientError(
            {"Error": {"Code": "404", "Message": "Not Found"}},
            "HeadObject",
        )

        result = await storage_service.file_exists("audio/nonexistent.wav")

        assert result is False

    @pytest.mark.asyncio
    async def test_file_exists_with_s3_uri(self, storage_service):
        """Test file_exists handles full S3 URI."""
        storage_service._mock_client.head_object.return_value = {}

        result = await storage_service.file_exists(
            "s3://text2song-audio/audio/test.wav"
        )

        assert result is True
        call_args = storage_service._mock_client.head_object.call_args
        assert call_args.kwargs["Key"] == "audio/test.wav"

    @pytest.mark.asyncio
    async def test_stream_file(self, storage_service):
        """Test streaming a file."""
        test_chunks = [b"chunk1", b"chunk2", b""]
        mock_body = MagicMock()
        mock_body.read.side_effect = test_chunks
        storage_service._mock_client.get_object.return_value = {"Body": mock_body}

        chunks = []
        async for chunk in storage_service.stream_file("audio/test.wav"):
            chunks.append(chunk)

        assert len(chunks) == 2
        assert chunks[0] == b"chunk1"
        assert chunks[1] == b"chunk2"

    @pytest.mark.asyncio
    async def test_stream_file_with_s3_uri(self, storage_service):
        """Test streaming a file using full S3 URI."""
        mock_body = MagicMock()
        mock_body.read.side_effect = [b"data", b""]
        storage_service._mock_client.get_object.return_value = {"Body": mock_body}

        chunks = []
        async for chunk in storage_service.stream_file(
            "s3://text2song-audio/audio/test.wav"
        ):
            chunks.append(chunk)

        # Verify key was extracted correctly
        call_args = storage_service._mock_client.get_object.call_args
        assert call_args.kwargs["Key"] == "audio/test.wav"
