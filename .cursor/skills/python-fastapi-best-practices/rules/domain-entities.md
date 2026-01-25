---
title: Define Pure Python Business Entities
impact: HIGH
impactDescription: Core business logic independent of frameworks, improves testability
tags: domain, entity, clean-architecture
---

## Define Pure Python Business Entities

Domain Entity is a pure Python class that encapsulates business data and behavior, with no framework dependencies.

**❌ Incorrect (Entity depends on ORM):**

```python
# models/prompt.py - This is ORM Model, not Domain Entity
from sqlalchemy import Column, String, JSON
from sqlalchemy.dialects.postgresql import UUID

class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(UUID, primary_key=True)
    text = Column(String)
    attributes = Column(JSON)
```

**✅ Correct (Pure Python Domain Entity):**

```python
# domain/entities/prompt.py
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class Prompt:
    """
    Prompt Domain Entity
    
    Encapsulates prompt business data and behavior rules.
    No framework dependencies (SQLAlchemy, Pydantic, FastAPI).
    """
    text: str
    attributes: dict = field(default_factory=dict)
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    # === Business Rules ===
    
    MIN_TEXT_LENGTH = 5
    MAX_TEXT_LENGTH = 1000
    ALLOWED_ATTRIBUTES = {"genre", "mood", "tempo", "instruments"}
    
    def __post_init__(self):
        """Validate on creation"""
        self._validate()
    
    def _validate(self):
        """Internal validation logic"""
        if not self.text or not self.text.strip():
            raise ValueError("Prompt text cannot be empty")
        if len(self.text) < self.MIN_TEXT_LENGTH:
            raise ValueError(f"Text must be at least {self.MIN_TEXT_LENGTH} characters")
        if len(self.text) > self.MAX_TEXT_LENGTH:
            raise ValueError(f"Text must be at most {self.MAX_TEXT_LENGTH} characters")
    
    def is_valid_for_generation(self) -> bool:
        """Check if valid for music generation"""
        return (
            self.MIN_TEXT_LENGTH <= len(self.text) <= self.MAX_TEXT_LENGTH
            and bool(self.text.strip())
        )
    
    def has_attribute(self, key: str) -> bool:
        """Check if has specific attribute"""
        return key in self.attributes
    
    def get_genre(self) -> str | None:
        """Get music genre"""
        return self.attributes.get("genre")
    
    def with_updated_text(self, new_text: str) -> "Prompt":
        """Return new entity with updated text (immutable)"""
        return Prompt(
            id=self.id,
            text=new_text,
            attributes=self.attributes.copy(),
            created_at=self.created_at,
        )


# domain/entities/audio_sample.py
@dataclass
class AudioSample:
    """Audio Sample Domain Entity"""
    prompt_id: UUID
    file_path: str
    duration_seconds: float
    sample_rate: int = 44100
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def is_valid_duration(self, max_duration: int = 30) -> bool:
        """Check if duration is within limit"""
        return 0 < self.duration_seconds <= max_duration
```

**Domain Entity vs ORM Model vs Pydantic Schema:**

| | Domain Entity | ORM Model | Pydantic Schema |
|---|---|---|---|
| Purpose | Business logic | Database mapping | API validation/serialization |
| Location | domain/entities/ | infrastructure/models/ | adapters/schemas/ |
| Dependency | Pure Python | SQLAlchemy | Pydantic |
| Behavior | Has business methods | Fields only | Validation only |

**Conversion Flow:**

```
API Request
    ↓
Pydantic Schema (Validation + Deserialization)
    ↓
Domain Entity (Business Logic)
    ↓
ORM Model (Save to DB)
    ↓
Domain Entity (Retrieved)
    ↓
Pydantic Schema (Serialization)
    ↓
API Response
```
