---
title: Service Must Not Handle HTTP Concepts
impact: CRITICAL
impactDescription: Separates business logic from transport layer, Service can be reused by CLI/Queue/gRPC
tags: service, clean-architecture, separation-of-concerns
---

## Service Must Not Handle HTTP Concepts

The Service layer should not know about HTTP, including status codes, headers, or HTTPException. These are the Adapter layer (Router) responsibilities.

**❌ Incorrect (Service coupled to HTTP):**

```python
# services/prompt_service.py - Wrong!
from fastapi import HTTPException  # ❌ Service should not import FastAPI

class PromptService:
    async def get_prompt(self, prompt_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id)
        if not prompt:
            # ❌ Service should not throw HTTPException
            raise HTTPException(status_code=404, detail="Prompt not found")
        return prompt
    
    async def create_prompt(self, data: dict) -> dict:
        prompt = await self._repo.save(Prompt(**data))
        # ❌ Service should not return HTTP response structure
        return {"status": 201, "data": prompt}
```

**✅ Correct (Service throws Domain Exception):**

```python
# domain/exceptions.py
class PromptNotFoundError(DomainException):
    """Prompt does not exist"""
    def __init__(self, prompt_id: UUID):
        self.prompt_id = prompt_id
        super().__init__(f"Prompt {prompt_id} not found")


# services/prompt_service.py - Correct!
class PromptService:
    async def get_prompt(self, prompt_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id)
        if not prompt:
            # ✅ Throw Domain Exception, let Router convert it
            raise PromptNotFoundError(prompt_id)
        return prompt
    
    async def create_prompt(self, text: str, attributes: dict) -> Prompt:
        prompt = Prompt(...)
        # ✅ Return Domain Entity directly
        return await self._repo.save(prompt)
```

**✅ Router handles conversion to HTTP Response:**

```python
# adapters/routers/prompts.py
from fastapi import APIRouter, HTTPException, Depends
from domain.exceptions import PromptNotFoundError, PromptValidationError

router = APIRouter(prefix="/prompts", tags=["prompts"])

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    service: PromptService = Depends(get_prompt_service),
):
    try:
        prompt = await service.get_prompt(prompt_id)
        return PromptResponse.from_entity(prompt)
    except PromptNotFoundError:
        # ✅ Router converts to HTTP 404
        raise HTTPException(status_code=404, detail="Prompt not found")


@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(
    data: PromptCreate,
    service: PromptService = Depends(get_prompt_service),
):
    try:
        prompt = await service.create_prompt(data.text, data.attributes)
        return PromptResponse.from_entity(prompt)
    except PromptValidationError as e:
        # ✅ Router converts to HTTP 400
        raise HTTPException(status_code=400, detail=str(e))
```

**✅ Better: Use Exception Handler for unified handling:**

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from domain.exceptions import PromptNotFoundError, PromptValidationError

app = FastAPI()

@app.exception_handler(PromptNotFoundError)
async def prompt_not_found_handler(request: Request, exc: PromptNotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})

@app.exception_handler(PromptValidationError)
async def validation_error_handler(request: Request, exc: PromptValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
```

**Why This Matters:**

1. **Reusability** - Same Service can be used by REST API, CLI, Message Queue
2. **Testability** - Testing Service doesn't require mocking HTTP
3. **Separation of Concerns** - Business logic unaffected by transport protocol
