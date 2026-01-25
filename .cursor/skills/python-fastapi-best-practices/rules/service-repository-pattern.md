---
title: Access Data Through Repository Abstraction
impact: CRITICAL
impactDescription: Decouples business logic from data access, improves testability
tags: service, repository, clean-architecture, dependency-inversion
---

## Access Data Through Repository Abstraction

Service should not directly operate `db.execute()` or SQLAlchemy, but access data through Repository interface.

**❌ Incorrect (Service directly operates DB):**

```python
# services/prompt_service.py - Wrong!
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Prompt  # ❌ Service depends on ORM Model

class PromptService:
    def __init__(self, db: AsyncSession):
        self.db = db  # ❌ Directly injecting DB Session
    
    async def get_prompt(self, prompt_id: UUID):
        # ❌ Service directly writes SQL/ORM query
        result = await self.db.execute(
            select(Prompt).where(Prompt.id == prompt_id)
        )
        return result.scalar_one_or_none()
```

**✅ Correct (Through Repository Interface):**

```python
# domain/interfaces/prompt_repository.py
from typing import Protocol
from uuid import UUID
from domain.entities.prompt import Prompt

class PromptRepository(Protocol):
    """Repository interface defined in Domain layer"""
    
    async def get_by_id(self, prompt_id: UUID) -> Prompt | None: ...
    async def save(self, prompt: Prompt) -> Prompt: ...
    async def delete(self, prompt_id: UUID) -> bool: ...
    async def list_paginated(self, limit: int, offset: int) -> tuple[list[Prompt], int]: ...


# services/prompt_service.py - Correct!
from domain.interfaces.prompt_repository import PromptRepository

class PromptService:
    def __init__(self, prompt_repo: PromptRepository):
        self._repo = prompt_repo  # ✅ Inject abstract interface
    
    async def get_prompt(self, prompt_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id)  # ✅ Access through interface
        if not prompt:
            raise PromptNotFoundError(prompt_id)
        return prompt
```

**✅ Repository Implementation in Adapter/Infrastructure layer:**

```python
# adapters/repositories/sqlalchemy_prompt_repository.py
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from domain.entities.prompt import Prompt as PromptEntity
from domain.interfaces.prompt_repository import PromptRepository
from infrastructure.models.prompt import Prompt as PromptModel

class SQLAlchemyPromptRepository(PromptRepository):
    """SQLAlchemy implementation of Repository"""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def get_by_id(self, prompt_id: UUID) -> PromptEntity | None:
        result = await self._session.execute(
            select(PromptModel).where(PromptModel.id == prompt_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def save(self, prompt: PromptEntity) -> PromptEntity:
        model = PromptModel(
            id=prompt.id,
            text=prompt.text,
            attributes=prompt.attributes,
            created_at=prompt.created_at,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return self._to_entity(model)
    
    def _to_entity(self, model: PromptModel) -> PromptEntity:
        """ORM Model → Domain Entity conversion"""
        return PromptEntity(
            id=model.id,
            text=model.text,
            attributes=model.attributes,
            created_at=model.created_at,
        )
```

**✅ Dependency Injection Setup:**

```python
# dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from adapters.repositories.sqlalchemy_prompt_repository import SQLAlchemyPromptRepository
from services.prompt_service import PromptService

async def get_prompt_repository(
    db: AsyncSession = Depends(get_db),
) -> PromptRepository:
    return SQLAlchemyPromptRepository(db)

async def get_prompt_service(
    repo: PromptRepository = Depends(get_prompt_repository),
) -> PromptService:
    return PromptService(repo)
```

**Benefits:**

1. **Testable** - Can test Service with FakeRepository
2. **Swappable** - Change DB (PostgreSQL → MongoDB) only requires Repository change
3. **Separation of Concerns** - Service doesn't know how data is stored
