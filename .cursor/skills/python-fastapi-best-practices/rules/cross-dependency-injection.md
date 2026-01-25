---
title: Use Depends() for Dependency Injection
impact: CRITICAL
impactDescription: Implements dependency inversion, improves testability and modularity
tags: cross-cutting, dependency-injection, fastapi, testing
---

## Use Depends() for Dependency Injection

All external dependencies (DB Session, Service, Config) should be injected through `Depends()`, not directly imported or created.

**❌ Incorrect (Directly creating dependencies):**

```python
# routers/prompts.py - Wrong!
from services.prompt_service import PromptService
from database import SessionLocal

@router.get("/{prompt_id}")
async def get_prompt(prompt_id: UUID):
    db = SessionLocal()  # ❌ Directly creating session
    service = PromptService(db)  # ❌ Directly creating service
    try:
        return await service.get_prompt(prompt_id)
    finally:
        db.close()
```

**✅ Correct (Inject through Depends):**

```python
# dependencies.py - Centralized dependency definitions
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from functools import lru_cache

from infrastructure.database import async_session
from infrastructure.config import Settings
from adapters.repositories.sqlalchemy_prompt_repository import SQLAlchemyPromptRepository
from services.prompt_service import PromptService


# DB Session dependency
async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# Settings dependency (cached with lru_cache)
@lru_cache
def get_settings() -> Settings:
    return Settings()


# Repository dependency
async def get_prompt_repository(
    db: AsyncSession = Depends(get_db),
) -> PromptRepository:
    return SQLAlchemyPromptRepository(db)


# Service dependency
async def get_prompt_service(
    repo: PromptRepository = Depends(get_prompt_repository),
) -> PromptService:
    return PromptService(repo)


# routers/prompts.py - Correct!
@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    service: PromptService = Depends(get_prompt_service),  # ✅ Injected
):
    prompt = await service.get_prompt(prompt_id)
    return PromptResponse.from_entity(prompt)
```

**✅ Dependency Chain Composition:**

```python
# Multi-layer dependencies auto-resolved
async def get_generation_service(
    prompt_service: PromptService = Depends(get_prompt_service),
    audio_repo: AudioRepository = Depends(get_audio_repository),
    settings: Settings = Depends(get_settings),
) -> GenerationService:
    return GenerationService(
        prompt_service=prompt_service,
        audio_repo=audio_repo,
        model_name=settings.base_model_name,
    )
```

**✅ Override Dependencies in Tests:**

```python
# tests/conftest.py
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

@pytest.fixture
def mock_prompt_service():
    service = AsyncMock(spec=PromptService)
    service.get_prompt.return_value = Prompt(
        id=uuid4(),
        text="test prompt",
        attributes={},
        created_at=datetime.utcnow(),
    )
    return service


@pytest.fixture
def client(mock_prompt_service):
    # ✅ Override real dependencies in tests
    app.dependency_overrides[get_prompt_service] = lambda: mock_prompt_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_get_prompt(client, mock_prompt_service):
    response = client.get(f"/prompts/{uuid4()}")
    assert response.status_code == 200
    mock_prompt_service.get_prompt.assert_called_once()
```

**Benefits of Dependency Injection:**

1. **Testable** - Can mock dependencies in tests
2. **Configurable** - Different implementations for different environments
3. **Lifecycle Management** - FastAPI auto-manages session closing
4. **Documented** - Dependencies clearly listed in function signature
