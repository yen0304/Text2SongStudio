---
title: Unified Error Handling Mechanism
impact: HIGH
impactDescription: Consistent error response format, better API user experience
tags: cross-cutting, error-handling, exceptions
---

## Unified Error Handling Mechanism

Define Domain Exceptions and use Exception Handlers to uniformly convert them to HTTP Responses.

**❌ Incorrect (Error handling scattered everywhere):**

```python
# routers/prompts.py - Wrong! Error handling repeated in every endpoint
@router.get("/{prompt_id}")
async def get_prompt(prompt_id: UUID, db: AsyncSession = Depends(get_db)):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt

@router.get("/audio/{audio_id}")
async def get_audio(audio_id: UUID, db: AsyncSession = Depends(get_db)):
    audio = await db.get(Audio, audio_id)
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")  # Repeated pattern
    return audio
```

**✅ Correct (Unified error handling):**

```python
# domain/exceptions.py - Define Domain Exception hierarchy
class DomainException(Exception):
    """Base Domain exception"""
    pass


class NotFoundError(DomainException):
    """Resource not found"""
    def __init__(self, resource: str, resource_id: str):
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} {resource_id} not found")


class ValidationError(DomainException):
    """Validation failed"""
    def __init__(self, message: str, field: str | None = None):
        self.message = message
        self.field = field
        super().__init__(message)


class ConflictError(DomainException):
    """Resource conflict (e.g., duplicate)"""
    pass


class UnauthorizedError(DomainException):
    """Not authenticated"""
    pass


class ForbiddenError(DomainException):
    """Not authorized"""
    pass
```

```python
# infrastructure/exception_handlers.py - Register global Exception Handlers
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from domain.exceptions import (
    DomainException,
    NotFoundError,
    ValidationError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
)


def register_exception_handlers(app: FastAPI):
    
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=404,
            content={
                "error": "not_found",
                "message": str(exc),
                "resource": exc.resource,
                "resource_id": exc.resource_id,
            },
        )
    
    @app.exception_handler(ValidationError)
    async def validation_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=400,
            content={
                "error": "validation_error",
                "message": exc.message,
                "field": exc.field,
            },
        )
    
    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError):
        return JSONResponse(
            status_code=409,
            content={"error": "conflict", "message": str(exc)},
        )
    
    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        # Fallback for unhandled domain exceptions
        return JSONResponse(
            status_code=500,
            content={"error": "internal_error", "message": str(exc)},
        )


# main.py
app = FastAPI()
register_exception_handlers(app)
```

```python
# services/prompt_service.py - Service throws Domain Exception
from domain.exceptions import NotFoundError, ValidationError

class PromptService:
    async def get_prompt(self, prompt_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id)
        if not prompt:
            raise NotFoundError("Prompt", str(prompt_id))  # ✅ Throw Domain Exception
        return prompt


# routers/prompts.py - Router becomes clean
@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    service: PromptService = Depends(get_prompt_service),
):
    # ✅ No try-catch needed, Exception Handler handles it
    prompt = await service.get_prompt(prompt_id)
    return PromptResponse.from_entity(prompt)
```
