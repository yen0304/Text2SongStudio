---
title: Design for Testability
impact: HIGH
impactDescription: Code is easy to test, improves confidence and quality
tags: cross-cutting, testing, dependency-injection
---

## Design for Testability

Design code with testing in mind: dependency injection, pure functions, interface abstraction.

**❌ Incorrect (Hard to test design):**

```python
# services/prompt_service.py - Wrong! Hard to test
import requests
from datetime import datetime
from database import SessionLocal

class PromptService:
    def create_prompt(self, text: str):
        # ❌ Directly creating DB session - cannot mock
        db = SessionLocal()
        
        # ❌ Directly calling external API - test will actually hit API
        response = requests.post("https://api.example.com/validate", json={"text": text})
        
        # ❌ Directly getting current time - cannot control
        prompt = Prompt(text=text, created_at=datetime.utcnow())
        
        db.add(prompt)
        db.commit()
        return prompt
```

**✅ Correct (Testable design):**

```python
# services/prompt_service.py - Correct! Easy to test
from typing import Protocol
from datetime import datetime
from uuid import UUID

class TimeProvider(Protocol):
    """Time provider interface"""
    def now(self) -> datetime: ...

class RealTimeProvider:
    def now(self) -> datetime:
        return datetime.utcnow()


class PromptService:
    def __init__(
        self,
        prompt_repo: PromptRepository,  # ✅ Dependency injection
        validator: PromptValidator,     # ✅ Dependency injection
        time_provider: TimeProvider = RealTimeProvider(),  # ✅ Replaceable
    ):
        self._repo = prompt_repo
        self._validator = validator
        self._time = time_provider
    
    async def create_prompt(self, text: str, attributes: dict) -> Prompt:
        # Validate
        await self._validator.validate(text)
        
        # Create entity
        prompt = Prompt(
            id=uuid4(),
            text=text,
            attributes=attributes,
            created_at=self._time.now(),  # ✅ Controllable time
        )
        
        return await self._repo.save(prompt)
```

**✅ Test Example:**

```python
# tests/unit/test_prompt_service.py
import pytest
from unittest.mock import AsyncMock, Mock
from datetime import datetime
from uuid import uuid4

from services.prompt_service import PromptService
from domain.entities.prompt import Prompt


class FakeTimeProvider:
    """Time provider for testing"""
    def __init__(self, fixed_time: datetime):
        self._time = fixed_time
    
    def now(self) -> datetime:
        return self._time


@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    repo.save.return_value = Prompt(
        id=uuid4(),
        text="test",
        attributes={},
        created_at=datetime(2024, 1, 1),
    )
    return repo


@pytest.fixture
def mock_validator():
    validator = AsyncMock()
    validator.validate.return_value = None
    return validator


@pytest.fixture
def fixed_time():
    return datetime(2024, 1, 1, 12, 0, 0)


@pytest.fixture
def service(mock_repo, mock_validator, fixed_time):
    return PromptService(
        prompt_repo=mock_repo,
        validator=mock_validator,
        time_provider=FakeTimeProvider(fixed_time),
    )


@pytest.mark.asyncio
async def test_create_prompt_success(service, mock_repo, mock_validator, fixed_time):
    # Act
    result = await service.create_prompt("test prompt", {"genre": "rock"})
    
    # Assert
    mock_validator.validate.assert_called_once_with("test prompt")
    mock_repo.save.assert_called_once()
    
    # Verify prompt passed to repo
    saved_prompt = mock_repo.save.call_args[0][0]
    assert saved_prompt.text == "test prompt"
    assert saved_prompt.created_at == fixed_time  # ✅ Time is predictable


@pytest.mark.asyncio
async def test_create_prompt_validation_fails(service, mock_validator):
    # Arrange
    mock_validator.validate.side_effect = ValidationError("Text too short")
    
    # Act & Assert
    with pytest.raises(ValidationError):
        await service.create_prompt("ab", {})
```

**✅ Integration Test with dependency_overrides:**

```python
# tests/integration/test_prompts_api.py
import pytest
from httpx import AsyncClient
from main import app
from dependencies import get_prompt_service

@pytest.fixture
def mock_service():
    service = AsyncMock(spec=PromptService)
    return service

@pytest.fixture
async def client(mock_service):
    app.dependency_overrides[get_prompt_service] = lambda: mock_service
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```
