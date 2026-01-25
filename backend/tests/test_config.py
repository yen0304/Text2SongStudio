"""Tests for application configuration."""

import os
from unittest.mock import patch


class TestSettings:
    """Tests for Settings configuration class."""

    def test_default_settings(self):
        """Test that default settings are correct."""
        from app.config import Settings

        settings = Settings()
        assert settings.app_name == "Text2Song Studio"
        assert settings.debug is False
        assert settings.default_sample_rate == 44100
        assert settings.default_duration == 10
        assert settings.max_duration == 30
        assert settings.max_samples_per_request == 4

    def test_database_url_async_conversion(self):
        """Test that postgresql:// is converted to postgresql+asyncpg://."""
        from app.config import Settings

        settings = Settings(database_url="postgresql://user:pass@host:5432/db")
        assert settings.database_url.startswith("postgresql+asyncpg://")

    def test_database_url_already_async(self):
        """Test that postgresql+asyncpg:// is not double-converted."""
        from app.config import Settings

        original_url = "postgresql+asyncpg://user:pass@host:5432/db"
        settings = Settings(database_url=original_url)
        assert settings.database_url == original_url

    def test_s3_default_settings(self):
        """Test S3/MinIO default settings."""
        from app.config import Settings

        settings = Settings()
        assert settings.s3_endpoint_url == "http://localhost:9000"
        assert settings.s3_access_key == "minioadmin"
        assert settings.s3_secret_key == "minioadmin"
        assert settings.s3_bucket_name == "text2song-audio"
        assert settings.s3_region == "us-east-1"

    def test_model_default_settings(self):
        """Test model default settings."""
        from app.config import Settings

        settings = Settings()
        assert settings.base_model_name == "facebook/musicgen-small"
        assert settings.model_cache_dir == "./model_cache"
        assert settings.adapters_dir == "./adapters"

    def test_cors_origins_default(self):
        """Test CORS origins default."""
        from app.config import Settings

        settings = Settings()
        assert "http://localhost:3000" in settings.cors_origins

    def test_get_settings_cached(self):
        """Test that get_settings returns cached settings."""
        from app.config import get_settings

        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2


class TestSettingsFromEnvironment:
    """Tests for Settings loaded from environment variables."""

    def test_debug_from_env(self):
        """Test debug setting from environment variable."""
        with patch.dict(os.environ, {"DEBUG": "true"}):
            from importlib import reload

            import app.config

            reload(app.config)
            # Clear cache by getting fresh settings
            app.config.get_settings.cache_clear()
            settings = app.config.Settings()
            assert settings.debug is True

    def test_app_name_from_env(self):
        """Test app_name setting from environment variable."""
        with patch.dict(os.environ, {"APP_NAME": "Custom App Name"}):
            from app.config import Settings

            settings = Settings()
            assert settings.app_name == "Custom App Name"

    def test_max_duration_from_env(self):
        """Test max_duration setting from environment variable."""
        with patch.dict(os.environ, {"MAX_DURATION": "60"}):
            from app.config import Settings

            settings = Settings()
            assert settings.max_duration == 60
