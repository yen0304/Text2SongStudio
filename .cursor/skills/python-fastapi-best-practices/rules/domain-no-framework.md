---
title: Domain Layer Must Not Import Frameworks
impact: CRITICAL
impactDescription: Ensures core business logic is framework-independent, improving testability and portability
tags: domain, clean-architecture, separation-of-concerns
---

## Domain Layer Must Not Import Frameworks

The Domain layer is the core of Clean Architecture and must be pure Python, with no dependencies on any framework (FastAPI, SQLAlchemy, Pydantic).

**❌ Incorrect (Domain depends on framework):**

```python
# domain/entities/prompt.py - Wrong!
from sqlalchemy import Column, String  # ❌ Depends on SQLAlchemy
from pydantic import BaseModel  # ❌ Depends on Pydantic

class Prompt(BaseModel):  # ❌ This is a Pydantic model, not a Domain Entity
    id: UUID
    text: str
```

**✅ Correct (Pure Python Domain Entity):**

```python
# domain/entities/prompt.py - Correct!
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

@dataclass
class Prompt:
    """Pure Python business entity, no framework dependencies"""
    id: UUID
    text: str
    attributes: dict
    created_at: datetime
    
    def validate_text_length(self) -> bool:
        """Business rule: text length constraint"""
        return 1 <= len(self.text) <= 1000
    
    def is_valid_for_generation(self) -> bool:
        """Business rule: check if valid for generation"""
        return self.validate_text_length() and bool(self.text.strip())
```

**✅ Domain Exceptions are also pure Python:**

```python
# domain/exceptions.py
class DomainException(Exception):
    """Base exception for Domain layer"""
    pass

class PromptValidationError(DomainException):
    """Prompt validation failed"""
    pass

class PromptNotFoundError(DomainException):
    """Prompt not found"""
    pass
```

**✅ Repository Interface defined in Domain (using Protocol):**

```python
# domain/interfaces/prompt_repository.py
from typing import Protocol
from uuid import UUID
from domain.entities.prompt import Prompt

class PromptRepository(Protocol):
    """Repository interface - defines 'what', not 'how'"""
    
    async def get_by_id(self, prompt_id: UUID) -> Prompt | None:
        ...
    
    async def save(self, prompt: Prompt) -> Prompt:
        ...
    
    async def delete(self, prompt_id: UUID) -> bool:
        ...
    
    async def list_all(self, limit: int, offset: int) -> list[Prompt]:
        ...
```

**Why This Matters:**

1. **Testability** - Domain logic can be unit tested with pure Python, no DB or API needed
2. **Portability** - Switching frameworks (Flask → FastAPI) doesn't require Domain changes
3. **Separation of Concerns** - Business logic is separate from technical details
4. **Easier to Understand** - Domain only expresses business intent
