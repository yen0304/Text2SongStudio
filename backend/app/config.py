from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Allow fields starting with "model_" (Pydantic v2 reserves this prefix)
    # Also configure env file loading
    model_config = SettingsConfigDict(
        protected_namespaces=(),
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Application
    app_name: str = "Text2Song Studio"
    debug: bool = False

    # Database
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/text2song"
    )
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/text2song"

    @field_validator("database_url", mode="before")
    @classmethod
    def convert_to_async_url(cls, v: str) -> str:
        """Convert postgresql:// to postgresql+asyncpg:// for async driver."""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # S3/MinIO
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket_name: str = "text2song-audio"
    s3_region: str = "us-east-1"

    # Model
    base_model_name: str = "facebook/musicgen-small"
    model_cache_dir: str = "./model_cache"
    adapters_dir: str = "./adapters"

    # Generation
    default_sample_rate: int = 32000  # MusicGen outputs 32kHz audio
    default_duration: int = 10
    max_duration: int = 120  # 2 minutes max, user can choose freely
    max_samples_per_request: int = 4

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
