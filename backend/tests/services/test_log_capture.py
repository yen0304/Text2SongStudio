"""Tests for log capture service."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest


class TestLogCaptureServiceCreateLog:
    """Tests for LogCaptureService.create_log method."""

    @pytest.mark.asyncio
    async def test_create_log(self):
        """Test creating a new training log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        async def mock_refresh(obj):
            obj.id = uuid4()
            obj.updated_at = datetime.utcnow()

        mock_db.refresh = mock_refresh

        log = await LogCaptureService.create_log(run_id, mock_db)

        assert log.run_id == run_id
        assert log.data == b""
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


class TestLogCaptureServiceAppendLog:
    """Tests for LogCaptureService.append_log method."""

    @pytest.mark.asyncio
    async def test_append_log_existing(self):
        """Test appending to an existing log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        existing_log = MagicMock()
        existing_log.data = b"existing "

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing_log
        mock_db.execute = AsyncMock(return_value=mock_result)

        size = await LogCaptureService.append_log(run_id, b"new data", mock_db)

        assert existing_log.data == b"existing new data"
        assert size == len(b"existing new data")
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_append_log_creates_new(self):
        """Test append creates log when not exists."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        size = await LogCaptureService.append_log(run_id, b"new data", mock_db)

        assert size == len(b"new data")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


class TestLogCaptureServiceGetLog:
    """Tests for LogCaptureService.get_log method."""

    @pytest.mark.asyncio
    async def test_get_log_exists(self):
        """Test getting an existing log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        expected_log = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = expected_log
        mock_db.execute = AsyncMock(return_value=mock_result)

        log = await LogCaptureService.get_log(run_id, mock_db)

        assert log == expected_log

    @pytest.mark.asyncio
    async def test_get_log_not_exists(self):
        """Test getting a non-existent log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        log = await LogCaptureService.get_log(run_id, mock_db)

        assert log is None


class TestLogCaptureServiceGetLogSize:
    """Tests for LogCaptureService.get_log_size method."""

    @pytest.mark.asyncio
    async def test_get_log_size_exists(self):
        """Test getting size of existing log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        mock_log = MagicMock()
        mock_log.data = b"test data"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_db.execute = AsyncMock(return_value=mock_result)

        size = await LogCaptureService.get_log_size(run_id, mock_db)

        assert size == len(b"test data")

    @pytest.mark.asyncio
    async def test_get_log_size_not_exists(self):
        """Test getting size of non-existent log."""
        from app.services.log_capture import LogCaptureService

        mock_db = AsyncMock()
        run_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        size = await LogCaptureService.get_log_size(run_id, mock_db)

        assert size == 0


class TestLogCaptureServiceCaptureSubprocessOutput:
    """Tests for LogCaptureService.capture_subprocess_output method."""

    @pytest.mark.asyncio
    async def test_capture_subprocess_output_success(self):
        """Test capturing subprocess output."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()

        # Create mock process
        mock_process = MagicMock()
        mock_process.returncode = 0

        # Create async iterator for stdout
        async def mock_read(_size):
            mock_read.call_count = getattr(mock_read, "call_count", 0) + 1
            if mock_read.call_count == 1:
                return b"test output"
            return b""

        mock_stdout = MagicMock()
        mock_stdout.read = mock_read
        mock_process.stdout = mock_stdout
        mock_process.stderr = None

        async def mock_wait():
            pass

        mock_process.wait = mock_wait

        # Create mock session factory
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_log = MagicMock()
        mock_log.data = b""
        mock_result.scalar_one_or_none.return_value = mock_log
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def mock_session_factory():
            return mock_session

        # Create async context manager
        class MockAsyncContextManager:
            async def __aenter__(self):
                return mock_session

            async def __aexit__(self, *args):
                pass

        def session_factory():
            return MockAsyncContextManager()

        exit_code = await LogCaptureService.capture_subprocess_output(
            run_id=run_id,
            process=mock_process,
            db_session_factory=session_factory,
        )

        assert exit_code == 0

    @pytest.mark.asyncio
    async def test_capture_subprocess_output_failure(self):
        """Test capturing subprocess output with failure."""
        from app.services.log_capture import LogCaptureService

        run_id = uuid4()

        # Create mock process
        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stdout = None
        mock_process.stderr = None

        async def mock_wait():
            pass

        mock_process.wait = mock_wait

        def session_factory():
            return AsyncMock()

        exit_code = await LogCaptureService.capture_subprocess_output(
            run_id=run_id,
            process=mock_process,
            db_session_factory=session_factory,
        )

        assert exit_code == 1
