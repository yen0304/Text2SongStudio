---
title: Each Service Handles One Use Case Only
impact: CRITICAL
impactDescription: Follows Single Responsibility Principle, improves maintainability and testability
tags: service, clean-architecture, single-responsibility
---

## Each Service Handles One Use Case Only

Each Service class or function should handle only one Use Case (business flow), avoiding God Service.

**❌ Incorrect (God Service does everything):**

```python
# services/prompt_service.py - Wrong! Does too much
class PromptService:
    async def create_prompt(self, data): ...
    async def get_prompt(self, id): ...
    async def update_prompt(self, id, data): ...
    async def delete_prompt(self, id): ...
    async def list_prompts(self, page, limit): ...
    async def generate_audio(self, prompt_id): ...      # ❌ Not Prompt's concern
    async def export_to_csv(self, prompt_ids): ...      # ❌ Not Prompt's concern
    async def send_notification(self, prompt_id): ...   # ❌ Not Prompt's concern
    async def calculate_statistics(self): ...           # ❌ Should be another Service
```

**✅ Correct (Each Service has one responsibility):**

```python
# services/prompt_service.py - Only handles Prompt CRUD
class PromptService:
    def __init__(self, prompt_repo: PromptRepository):
        self._repo = prompt_repo
    
    async def create_prompt(self, text: str, attributes: dict) -> Prompt:
        prompt = Prompt(
            id=uuid4(),
            text=text,
            attributes=attributes,
            created_at=datetime.utcnow(),
        )
        if not prompt.is_valid_for_generation():
            raise PromptValidationError("Invalid prompt")
        return await self._repo.save(prompt)
    
    async def get_prompt(self, prompt_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id)
        if not prompt:
            raise PromptNotFoundError(f"Prompt {prompt_id} not found")
        return prompt


# services/generation_service.py - Only handles music generation
class GenerationService:
    def __init__(
        self,
        prompt_service: PromptService,
        audio_repo: AudioRepository,
        model_client: MusicGenClient,
    ):
        self._prompts = prompt_service
        self._audio_repo = audio_repo
        self._model = model_client
    
    async def generate_audio(self, prompt_id: UUID) -> AudioSample:
        prompt = await self._prompts.get_prompt(prompt_id)
        audio_data = await self._model.generate(prompt.text)
        return await self._audio_repo.save(audio_data)


# services/export_service.py - Only handles export
class ExportService:
    async def export_prompts_to_csv(self, prompt_ids: list[UUID]) -> bytes:
        ...


# services/statistics_service.py - Only handles statistics
class StatisticsService:
    async def calculate_prompt_statistics(self) -> PromptStats:
        ...
```

**Use Case Functional Style (more concise):**

```python
# services/create_prompt.py
async def create_prompt(
    text: str,
    attributes: dict,
    prompt_repo: PromptRepository,
) -> Prompt:
    """Create Prompt Use Case"""
    prompt = Prompt(
        id=uuid4(),
        text=text,
        attributes=attributes,
        created_at=datetime.utcnow(),
    )
    
    if not prompt.is_valid_for_generation():
        raise PromptValidationError("Invalid prompt text")
    
    return await prompt_repo.save(prompt)
```

**How to detect SRP violations:**

1. Service name is hard to define → probably does too much
2. Constructor injects more than 4-5 dependencies → probably does too much
3. Methods don't share state → should be split
4. Changing one feature affects others → should be split
