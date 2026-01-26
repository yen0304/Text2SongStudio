"""Tests for the logs router and log capture service."""

import base64
from datetime import datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest


class TestLogsRouter:
    """Tests for logs API endpoints."""

    def test_get_logs_not_found(self, client, mock_db_session):
        """Test getting logs for non-existent run returns 404."""
        run_id = uuid4()

        # Mock execute to return None for run lookup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result

        response = client.get(f"/runs/{run_id}/logs")
        assert response.status_code == 404

    def test_get_logs_empty(self, client, mock_db_session):
        """Test getting logs when no log exists returns empty response."""
        run_id = uuid4()

        # Mock run exists
        mock_run = MagicMock()
        mock_run.id = run_id

        # First call returns run, second returns None (no log)
        mock_result1 = MagicMock()
        mock_result1.scalar_one_or_none.return_value = mock_run
        mock_result2 = MagicMock()
        mock_result2.scalar_one_or_none.return_value = None

        mock_db_session.execute.side_effect = [mock_result1, mock_result2]

        response = client.get(f"/runs/{run_id}/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["run_id"] == str(run_id)
        assert data["data"] == ""
        assert data["size"] == 0

    def test_get_logs_with_data(self, client, mock_db_session):
        """Test getting logs with existing data."""
        run_id = uuid4()
        log_data = b"Test log output\nLine 2"

        # Mock run exists
        mock_run = MagicMock()
        mock_run.id = run_id

        # Mock log exists with data
        mock_log = MagicMock()
        mock_log.run_id = run_id
        mock_log.data = log_data
        mock_log.updated_at = datetime.utcnow()

        mock_result1 = MagicMock()
        mock_result1.scalar_one_or_none.return_value = mock_run
        mock_result2 = MagicMock()
        mock_result2.scalar_one_or_none.return_value = mock_log

        mock_db_session.execute.side_effect = [mock_result1, mock_result2]

        response = client.get(f"/runs/{run_id}/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["run_id"] == str(run_id)
        assert data["data"] == base64.b64encode(log_data).decode("utf-8")
        assert data["size"] == len(log_data)


class TestLogCaptureService:
    """Tests for the LogCaptureService."""

    @pytest.mark.asyncio
    async def test_create_log(self, mock_db):
        """Test creating a new training log."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()

        await LogCaptureService.create_log(run_id, mock_db)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_append_log_creates_if_not_exists(self, mock_db):
        """Test appending to a non-existent log creates it."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()
        chunk = b"Test chunk"

        # Mock no existing log
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        size = await LogCaptureService.append_log(run_id, chunk, mock_db)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert size == len(chunk)

    @pytest.mark.asyncio
    async def test_append_log_appends_to_existing(self, mock_db):
        """Test appending to existing log."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()
        existing_data = b"Existing "
        new_chunk = b"chunk"

        # Mock existing log
        mock_log = MagicMock()
        mock_log.run_id = run_id
        mock_log.data = existing_data

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_db.execute.return_value = mock_result

        size = await LogCaptureService.append_log(run_id, new_chunk, mock_db)

        mock_db.commit.assert_called_once()
        assert mock_log.data == existing_data + new_chunk
        assert size == len(existing_data) + len(new_chunk)

    @pytest.mark.asyncio
    async def test_get_log(self, mock_db):
        """Test getting a log."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()
        mock_log = MagicMock()
        mock_log.run_id = run_id
        mock_log.data = b"Log data"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_db.execute.return_value = mock_result

        log = await LogCaptureService.get_log(run_id, mock_db)

        assert log == mock_log

    @pytest.mark.asyncio
    async def test_get_log_size(self, mock_db):
        """Test getting log size."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()
        mock_log = MagicMock()
        mock_log.data = b"1234567890"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_db.execute.return_value = mock_result

        size = await LogCaptureService.get_log_size(run_id, mock_db)

        assert size == 10

    @pytest.mark.asyncio
    async def test_get_log_size_no_log(self, mock_db):
        """Test getting log size when no log exists."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        size = await LogCaptureService.get_log_size(run_id, mock_db)

        assert size == 0
