---
title: Use pydantic-settings for Configuration
impact: HIGH
impactDescription: Type-safe configuration management with environment variables and .env files
tags: infrastructure, config, settings, environment
---

## Use pydantic-settings for Configuration

Use `pydantic-settings` to manage application configuration with type validation and environment variable support.

**❌ Incorrect (Reading environment variables directly):**

```python
# config.py - Wrong!
import os

DATABASE_URL = os.getenv("DATABASE_URL")  # May be None
DEBUG = os.getenv("DEBUG")  # String "true" is not bool
PORT = os.getenv("PORT")  # String is not int

# Usage
from config import DATABASE_URL
engine = create_engine(DATABASE_URL)  # May fail if None
```

**✅ Correct (Using pydantic-settings):**

```python
# infrastructure/config.py
from functools import lru_cache
from pydantic import field_validator, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings - automatically loaded from environment variables"""
    
    # Application
    app_name: str = "Text2Song Studio"
    debug: bool = False
    
    # Database - required, startup fails if not set
    database_url: str
    
    # Redis - optional with defaults
    redis_url: str = "redis://localhost:6379"
    
    # S3/MinIO
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str
    s3_secret_key: str
    s3_bucket_name: str = "text2song-audio"
    
    # Model settings
    base_model_name: str = "facebook/musicgen-small"
    model_cache_dir: str = "./model_cache"
    
    # API limits
    max_duration: int = Field(default=30, ge=1, le=300)
    max_samples_per_request: int = Field(default=4, ge=1, le=10)
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]
    
    @field_validator("database_url", mode="before")
    @classmethod
    def convert_to_async_url(cls, v: str) -> str:
        """Automatically convert to async driver URL"""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Support comma-separated strings"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # Ignore undefined environment variables
    }


@lru_cache
def get_settings() -> Settings:
    """Get settings (cached, read only once)"""
    return Settings()
```

**✅ Usage in application:**

```python
# main.py
from infrastructure.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)


# Or via dependency injection
from fastapi import Depends

@router.get("/info")
async def get_info(settings: Settings = Depends(get_settings)):
    return {"app": settings.app_name, "debug": settings.debug}
```

**✅ .env file example:**

```env
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/text2song
DEBUG=true
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

**✅ Environment-specific settings:**

```python
class Settings(BaseSettings):
    environment: str = "development"
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    model_config = {
        "env_file": f".env.{os.getenv('ENVIRONMENT', 'development')}",
    }
```
