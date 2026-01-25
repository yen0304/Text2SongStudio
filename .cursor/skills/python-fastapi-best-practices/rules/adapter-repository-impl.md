---
title: Repository Implementation Lives in Adapter Layer
impact: HIGH
impactDescription: Implements dependency inversion, isolates data access details
tags: adapter, repository, clean-architecture, sqlalchemy
---

## Repository Implementation Lives in Adapter Layer

Repository interface is defined in Domain layer, implementation lives in Adapter/Infrastructure layer.

**Architecture:**

```
domain/
  interfaces/
    prompt_repository.py  # Interface (Protocol)
    
adapters/
  repositories/
    sqlalchemy_prompt_repository.py  # SQLAlchemy implementation
    memory_prompt_repository.py      # In-memory implementation for testing
```

**✅ Domain Layer: Define Interface (Protocol)**

```python
# domain/interfaces/prompt_repository.py
from typing import Protocol
from uuid import UUID
from domain.entities.prompt import Prompt


class PromptRepository(Protocol):
    """
    Prompt Repository Interface
    
    Defines 'what', not 'how'.
    Service depends on this interface, not concrete implementation.
    """
    
    async def get_by_id(self, prompt_id: UUID) -> Prompt | None:
        """Get Prompt by ID"""
        ...
    
    async def save(self, prompt: Prompt) -> Prompt:
        """Save Prompt (create or update)"""
        ...
    
    async def delete(self, prompt_id: UUID) -> bool:
        """Delete Prompt, return success status"""
        ...
    
    async def list_paginated(
        self,
        limit: int,
        offset: int,
    ) -> tuple[list[Prompt], int]:
        """Paginated query, returns (items, total_count)"""
        ...
    
    async def find_by_text_contains(self, keyword: str) -> list[Prompt]:
        """Search Prompts containing keyword"""
        ...
```

**✅ Adapter Layer: SQLAlchemy Implementation**

```python
# adapters/repositories/sqlalchemy_prompt_repository.py
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from domain.entities.prompt import Prompt as PromptEntity
from domain.interfaces.prompt_repository import PromptRepository
from infrastructure.models.prompt import Prompt as PromptModel


class SQLAlchemyPromptRepository(PromptRepository):
    """SQLAlchemy implementation of Prompt Repository"""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def get_by_id(self, prompt_id: UUID) -> PromptEntity | None:
        result = await self._session.execute(
            select(PromptModel).where(PromptModel.id == prompt_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def save(self, prompt: PromptEntity) -> PromptEntity:
        # Check if exists
        existing = await self._session.get(PromptModel, prompt.id)
        
        if existing:
            # Update
            existing.text = prompt.text
            existing.attributes = prompt.attributes
        else:
            # Create
            model = self._to_model(prompt)
            self._session.add(model)
        
        await self._session.flush()
        return prompt
    
    async def delete(self, prompt_id: UUID) -> bool:
        result = await self._session.execute(
            select(PromptModel).where(PromptModel.id == prompt_id)
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            return True
        return False
    
    async def list_paginated(
        self,
        limit: int,
        offset: int,
    ) -> tuple[list[PromptEntity], int]:
        # Total count
        count_result = await self._session.execute(
            select(func.count(PromptModel.id))
        )
        total = count_result.scalar()
        
        # Paginated data
        result = await self._session.execute(
            select(PromptModel)
            .order_by(PromptModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    # === Conversion Methods ===
    
    def _to_entity(self, model: PromptModel) -> PromptEntity:
        """ORM Model → Domain Entity"""
        return PromptEntity(
            id=model.id,
            text=model.text,
            attributes=model.attributes or {},
            created_at=model.created_at,
        )
    
    def _to_model(self, entity: PromptEntity) -> PromptModel:
        """Domain Entity → ORM Model"""
        return PromptModel(
            id=entity.id,
            text=entity.text,
            attributes=entity.attributes,
            created_at=entity.created_at,
        )
```

**✅ In-Memory Implementation for Testing**

```python
# adapters/repositories/memory_prompt_repository.py
class InMemoryPromptRepository(PromptRepository):
    """In-Memory Repository for testing"""
    
    def __init__(self):
        self._storage: dict[UUID, Prompt] = {}
    
    async def get_by_id(self, prompt_id: UUID) -> Prompt | None:
        return self._storage.get(prompt_id)
    
    async def save(self, prompt: Prompt) -> Prompt:
        self._storage[prompt.id] = prompt
        return prompt
    
    async def delete(self, prompt_id: UUID) -> bool:
        if prompt_id in self._storage:
            del self._storage[prompt_id]
            return True
        return False
```
