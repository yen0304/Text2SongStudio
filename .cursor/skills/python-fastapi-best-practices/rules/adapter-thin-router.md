---
title: Router Only Adapts, Contains No Business Logic
impact: CRITICAL
impactDescription: Keep Router thin, business logic stays in Service
tags: adapter, router, thin-controller, clean-architecture
---

## Router Only Adapts, Contains No Business Logic

Router (Controller) responsibility is only: receive request → call Service → return response. It should not contain business logic.

**❌ Incorrect (Fat Router):**

```python
# routers/prompts.py - Wrong! Router too fat
@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(
    data: PromptCreate,
    db: AsyncSession = Depends(get_db),  # ❌ Directly injecting DB
):
    # ❌ Business logic in Router
    if len(data.text) < 10:
        raise HTTPException(400, "Text too short")
    
    if data.attributes:
        # ❌ Complex validation logic
        allowed_keys = {"genre", "mood", "tempo"}
        if not set(data.attributes.keys()).issubset(allowed_keys):
            raise HTTPException(400, "Invalid attributes")
    
    # ❌ Directly operating ORM
    prompt = Prompt(
        text=data.text,
        attributes=data.attributes or {},
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    
    # ❌ Data transformation logic
    return PromptResponse(
        id=prompt.id,
        text=prompt.text,
        attributes=prompt.attributes,
        created_at=prompt.created_at,
        audio_sample_ids=[s.id for s in prompt.audio_samples],
    )
```

**✅ Correct (Thin Router):**

```python
# adapters/routers/prompts.py - Correct! Router only adapts
from fastapi import APIRouter, Depends, HTTPException
from services.prompt_service import PromptService
from adapters.schemas.prompt import PromptCreate, PromptResponse
from domain.exceptions import PromptValidationError, PromptNotFoundError

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(
    data: PromptCreate,  # ✅ Pydantic handles basic validation
    service: PromptService = Depends(get_prompt_service),  # ✅ Inject Service
):
    try:
        # ✅ Call Service, one line done
        prompt = await service.create_prompt(
            text=data.text,
            attributes=data.attributes,
        )
        # ✅ Convert to Response Schema
        return PromptResponse.from_entity(prompt)
    except PromptValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    service: PromptService = Depends(get_prompt_service),
):
    try:
        prompt = await service.get_prompt(prompt_id)
        return PromptResponse.from_entity(prompt)
    except PromptNotFoundError:
        raise HTTPException(status_code=404, detail="Prompt not found")


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: PromptService = Depends(get_prompt_service),
):
    prompts, total = await service.list_prompts(page=page, limit=limit)
    return PromptListResponse(
        items=[PromptResponse.from_entity(p) for p in prompts],
        total=total,
        page=page,
        limit=limit,
    )
```

**Router Responsibilities (only these):**

1. ✅ Define HTTP method and path
2. ✅ Parse path parameters, query parameters
3. ✅ Validate request body with Pydantic Schema
4. ✅ Inject dependencies (Service)
5. ✅ Call Service methods
6. ✅ Convert Domain Exception to HTTPException
7. ✅ Return Response Schema

**Router should NOT do:**

1. ❌ Business logic decisions
2. ❌ Direct database operations
3. ❌ Complex data transformations
4. ❌ Call external APIs
5. ❌ File processing logic
