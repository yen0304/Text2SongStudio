---
title: Always Define Explicit Response Schema
impact: HIGH
impactDescription: Ensures accurate API documentation, prevents internal structure leakage
tags: adapter, schema, response, api-contract
---

## Always Define Explicit Response Schema

Always use `response_model` to define response structure. Never return ORM Model or dict directly.

**❌ Incorrect (Returning ORM Model directly):**

```python
@router.get("/{prompt_id}")
async def get_prompt(prompt_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    return prompt  # ❌ Returning ORM Model directly
    # Problems:
    # 1. May expose internal fields (password_hash, internal_notes)
    # 2. May trigger lazy loading issues
    # 3. OpenAPI docs are inaccurate
```

**❌ Incorrect (Returning dict):**

```python
@router.get("/{prompt_id}")
async def get_prompt(prompt_id: UUID):
    prompt = await service.get_prompt(prompt_id)
    return {  # ❌ Returning dict, no type guarantee
        "id": str(prompt.id),
        "text": prompt.text,
    }
```

**✅ Correct (Using Response Schema):**

```python
# adapters/schemas/prompt.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class PromptResponse(BaseModel):
    """Prompt API response structure"""
    id: UUID
    text: str
    attributes: dict
    created_at: datetime
    audio_sample_ids: list[UUID] = []
    
    model_config = {"from_attributes": True}
    
    @classmethod
    def from_entity(cls, entity: "PromptEntity") -> "PromptResponse":
        """Create Response from Domain Entity"""
        return cls(
            id=entity.id,
            text=entity.text,
            attributes=entity.attributes,
            created_at=entity.created_at,
            audio_sample_ids=[],  # Need separate query
        )


# adapters/routers/prompts.py
@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    service: PromptService = Depends(get_prompt_service),
):
    prompt = await service.get_prompt(prompt_id)
    return PromptResponse.from_entity(prompt)
```

**✅ Separate Response schemas for different purposes:**

```python
# List view - brief version
class PromptBrief(BaseModel):
    id: UUID
    text: str
    created_at: datetime

# Detail view - full version
class PromptDetail(BaseModel):
    id: UUID
    text: str
    attributes: dict
    created_at: datetime
    audio_samples: list[AudioSampleBrief]
    feedback_count: int

# List response
class PromptListResponse(BaseModel):
    items: list[PromptBrief]
    total: int
    page: int
    limit: int
```

**✅ Separate Create/Update/Response Schema:**

```python
# Create - only accepts required fields
class PromptCreate(BaseModel):
    text: str
    attributes: dict | None = None

# Update - all fields optional
class PromptUpdate(BaseModel):
    text: str | None = None
    attributes: dict | None = None

# Response - includes all public fields
class PromptResponse(BaseModel):
    id: UUID
    text: str
    attributes: dict
    created_at: datetime
```
