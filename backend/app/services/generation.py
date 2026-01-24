import asyncio
import uuid
import io
from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import get_settings
from app.models import GenerationJob, JobStatus, AudioSample, Prompt, Adapter
from app.services.storage import StorageService

settings = get_settings()

# Track cancelled jobs
_cancelled_jobs: set[UUID] = set()


class GenerationService:
    _model = None
    _processor = None
    _current_adapter_id = None

    @classmethod
    def cancel_job(cls, job_id: UUID):
        _cancelled_jobs.add(job_id)

    @classmethod
    def is_cancelled(cls, job_id: UUID) -> bool:
        return job_id in _cancelled_jobs

    @classmethod
    async def load_model(cls):
        if cls._model is not None:
            return

        try:
            from transformers import AutoProcessor, MusicgenForConditionalGeneration

            cls._processor = AutoProcessor.from_pretrained(
                settings.base_model_name,
                cache_dir=settings.model_cache_dir,
            )
            cls._model = MusicgenForConditionalGeneration.from_pretrained(
                settings.base_model_name,
                cache_dir=settings.model_cache_dir,
            )

            # Move to GPU if available
            import torch
            if torch.cuda.is_available():
                cls._model = cls._model.to("cuda")
        except Exception as e:
            print(f"Failed to load model: {e}")
            raise

    @classmethod
    async def load_adapter(cls, adapter_id: UUID | None, db: AsyncSession):
        if adapter_id == cls._current_adapter_id:
            return

        if cls._model is None:
            await cls.load_model()

        # Remove current adapter if any
        if cls._current_adapter_id is not None:
            try:
                from peft import PeftModel
                if isinstance(cls._model, PeftModel):
                    cls._model = cls._model.unload()
            except Exception:
                pass

        cls._current_adapter_id = None

        if adapter_id is None:
            return

        # Load new adapter
        result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
        adapter = result.scalar_one_or_none()

        if adapter is None:
            raise ValueError(f"Adapter {adapter_id} not found")

        try:
            from peft import PeftModel
            cls._model = PeftModel.from_pretrained(
                cls._model,
                adapter.storage_path,
            )
            cls._current_adapter_id = adapter_id
        except Exception as e:
            print(f"Failed to load adapter: {e}")
            raise

    @classmethod
    async def generate_audio(
        cls,
        prompt_text: str,
        duration: int | None = None,
        seed: int | None = None,
        temperature: float = 1.0,
        top_k: int = 250,
        top_p: float = 0.0,
    ) -> tuple[bytes, float, int]:
        import torch
        import soundfile as sf
        import numpy as np

        if cls._model is None:
            await cls.load_model()

        duration = duration or settings.default_duration
        sample_rate = settings.default_sample_rate

        # Set seed for reproducibility
        if seed is not None:
            torch.manual_seed(seed)

        # Prepare inputs
        inputs = cls._processor(
            text=[prompt_text],
            padding=True,
            return_tensors="pt",
        )

        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        # Generate
        max_new_tokens = int(duration * 50)  # ~50 tokens per second for MusicGen

        with torch.no_grad():
            audio_values = cls._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p if top_p > 0 else None,
            )

        # Convert to audio bytes
        audio = audio_values[0, 0].cpu().numpy()
        audio_duration = len(audio) / sample_rate

        # Save to bytes using soundfile
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format="WAV")
        buffer.seek(0)

        return buffer.read(), audio_duration, sample_rate

    @classmethod
    async def process_job(cls, job_id: UUID):
        # Create new database session for background task
        engine = create_async_engine(settings.database_url)
        async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as db:
            try:
                # Get job
                result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
                job = result.scalar_one_or_none()

                if not job or cls.is_cancelled(job_id):
                    return

                # Update status
                job.status = JobStatus.PROCESSING
                await db.commit()

                # Get prompt
                result = await db.execute(select(Prompt).where(Prompt.id == job.prompt_id))
                prompt = result.scalar_one_or_none()

                if not prompt:
                    job.status = JobStatus.FAILED
                    job.error = "Prompt not found"
                    await db.commit()
                    return

                # Build prompt text with attributes
                prompt_text = prompt.text
                if prompt.attributes:
                    attrs = prompt.attributes
                    if attrs.get("style"):
                        prompt_text = f"{attrs['style']} music: {prompt_text}"
                    if attrs.get("mood"):
                        prompt_text = f"{attrs['mood']} {prompt_text}"
                    if attrs.get("instrumentation"):
                        prompt_text = f"{prompt_text} with {', '.join(attrs['instrumentation'])}"

                # Load adapter if specified
                await cls.load_adapter(job.adapter_id, db)

                # Generate samples
                storage = StorageService()
                audio_ids = []
                params = job.generation_params or {}

                for i in range(job.num_samples):
                    if cls.is_cancelled(job_id):
                        job.status = JobStatus.CANCELLED
                        job.completed_at = datetime.utcnow()
                        await db.commit()
                        return

                    # Use different seed for each sample
                    seed = params.get("seed")
                    if seed is not None:
                        seed = seed + i

                    # Generate audio
                    audio_bytes, duration, sample_rate = await cls.generate_audio(
                        prompt_text,
                        duration=params.get("duration"),
                        seed=seed,
                        temperature=params.get("temperature", 1.0),
                        top_k=params.get("top_k", 250),
                        top_p=params.get("top_p", 0.0),
                    )

                    # Upload to storage
                    audio_id = uuid.uuid4()
                    storage_key = f"audio/{job.prompt_id}/{audio_id}.wav"
                    await storage.upload_file(storage_key, audio_bytes)

                    # Create audio sample record
                    sample = AudioSample(
                        id=audio_id,
                        prompt_id=job.prompt_id,
                        adapter_id=job.adapter_id,
                        storage_path=storage_key,
                        duration_seconds=duration,
                        sample_rate=sample_rate,
                        generation_params={
                            "seed": seed,
                            "temperature": params.get("temperature", 1.0),
                            "top_k": params.get("top_k", 250),
                            "top_p": params.get("top_p", 0.0),
                        },
                    )
                    db.add(sample)
                    audio_ids.append(audio_id)

                    # Update progress
                    job.progress = (i + 1) / job.num_samples
                    await db.commit()

                # Complete job
                job.status = JobStatus.COMPLETED
                job.audio_ids = audio_ids
                job.completed_at = datetime.utcnow()
                await db.commit()

            except Exception as e:
                job.status = JobStatus.FAILED
                job.error = str(e)
                job.completed_at = datetime.utcnow()
                await db.commit()
                raise

            finally:
                _cancelled_jobs.discard(job_id)
                await engine.dispose()
