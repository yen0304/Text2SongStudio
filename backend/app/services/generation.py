import asyncio
import io
import threading
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Any
from uuid import UUID

import soundfile as sf
import torch
from peft import PeftModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from transformers import AutoProcessor, MusicgenForConditionalGeneration

from app.config import get_settings
from app.database import async_session_factory
from app.models import Adapter, AudioSample, GenerationJob, JobStatus, Prompt
from app.models.system_setting import SystemSetting
from app.services.storage import StorageService

settings = get_settings()

# Track cancelled jobs
_cancelled_jobs: set[UUID] = set()

# Constants for system settings keys
SETTING_ACTIVE_MODEL = "active_model_id"


async def get_system_setting(key: str) -> str | None:
    """Read a system setting from the database."""
    async with async_session_factory() as session:
        result = await session.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        return setting.value if setting else None


async def set_system_setting(key: str, value: str) -> None:
    """Write a system setting to the database (upsert)."""
    async with async_session_factory() as session:
        result = await session.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
        else:
            setting = SystemSetting(key=key, value=value)
            session.add(setting)
        await session.commit()


class GenerationService:
    _model = None
    _processor = None
    _current_adapter_id = None
    _current_model_name: str | None = None
    _persisted_model_name: str | None = None  # Loaded from DB on init
    _model_lock = asyncio.Lock()
    _is_switching = False
    _initialized = False

    @classmethod
    async def initialize(cls) -> None:
        """Initialize service by loading persisted model name from database."""
        if cls._initialized:
            return
        cls._persisted_model_name = await get_system_setting(SETTING_ACTIVE_MODEL)
        cls._initialized = True

    @classmethod
    def get_current_model_name(cls) -> str:
        """Get the name of the currently loaded model."""
        # Priority: loaded model > persisted setting > default config
        return (
            cls._current_model_name
            or cls._persisted_model_name
            or settings.base_model_name
        )

    @classmethod
    def is_switching(cls) -> bool:
        """Check if a model switch is in progress."""
        return cls._is_switching

    @classmethod
    def cancel_job(cls, job_id: UUID):
        _cancelled_jobs.add(job_id)

    @classmethod
    def is_cancelled(cls, job_id: UUID) -> bool:
        return job_id in _cancelled_jobs

    @classmethod
    async def load_model(cls, model_name: str | None = None):
        """
        Load a model. If model_name is provided, load that specific model.
        Otherwise, load the default model from settings.
        """
        target_model = model_name or settings.base_model_name

        # If model is already loaded and matches, skip
        if cls._model is not None and cls._current_model_name == target_model:
            return

        try:
            cls._processor = AutoProcessor.from_pretrained(
                target_model,
                cache_dir=settings.model_cache_dir,
            )
            cls._model = MusicgenForConditionalGeneration.from_pretrained(
                target_model,
                cache_dir=settings.model_cache_dir,
            )

            # Move to GPU if available
            if torch.cuda.is_available():
                cls._model = cls._model.to("cuda")

            cls._current_model_name = target_model
            cls._current_adapter_id = None  # Clear adapter when model changes
        except Exception as e:
            print(f"Failed to load model: {e}")
            raise

    @classmethod
    async def unload_model(cls):
        """Unload the current model to free GPU memory."""
        if cls._model is not None:
            # Unload adapter first if any
            if cls._current_adapter_id is not None:
                try:
                    if isinstance(cls._model, PeftModel):
                        cls._model = cls._model.unload()
                except Exception:
                    pass
                cls._current_adapter_id = None

            # Delete model and processor
            del cls._model
            del cls._processor
            cls._model = None
            cls._processor = None
            cls._current_model_name = None

            # Clear GPU cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

    @classmethod
    async def switch_model(cls, model_name: str) -> tuple[str, str]:
        """
        Switch to a different model.

        Returns:
            Tuple of (previous_model_name, new_model_name)

        Raises:
            RuntimeError: If a switch is already in progress
        """
        async with cls._model_lock:
            if cls._is_switching:
                raise RuntimeError("Model switch already in progress")

            cls._is_switching = True
            previous_model = cls._current_model_name or settings.base_model_name

            try:
                # Unload current model
                await cls.unload_model()

                # Load new model
                await cls.load_model(model_name)

                return previous_model, cls._current_model_name or model_name
            finally:
                cls._is_switching = False

    @classmethod
    async def switch_model_with_progress(
        cls, model_name: str
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Switch to a different model with progress streaming.

        Yields progress events during the switch process.
        """
        if cls._is_switching:
            yield {
                "event": "error",
                "message": "Model switch already in progress",
            }
            return

        async with cls._model_lock:
            cls._is_switching = True
            previous_model = cls._current_model_name or settings.base_model_name

            try:
                # Stage 1: Unload current model
                yield {
                    "event": "status",
                    "stage": "unloading",
                    "message": f"Unloading {previous_model}...",
                }
                await cls.unload_model()
                await asyncio.sleep(0.1)  # Small delay for UI feedback

                # Stage 2: Download/load new model with progress capture
                yield {
                    "event": "status",
                    "stage": "downloading",
                    "message": f"Loading {model_name}...",
                }

                # Load model with stderr capture for progress
                async for progress in cls._load_model_with_progress(model_name):
                    yield progress

                # Persist active model to database
                await set_system_setting(SETTING_ACTIVE_MODEL, model_name)
                cls._persisted_model_name = model_name

                # Stage 3: Done
                yield {
                    "event": "done",
                    "stage": "complete",
                    "message": f"Successfully switched to {model_name}",
                    "previous_model": previous_model,
                    "current_model": cls._current_model_name or model_name,
                }
            except Exception as e:
                yield {
                    "event": "error",
                    "message": f"Failed to switch model: {str(e)}",
                }
            finally:
                cls._is_switching = False

    @classmethod
    async def _load_model_with_progress(
        cls, model_name: str
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Load model while capturing download progress via custom tqdm class."""
        from huggingface_hub import list_repo_files, snapshot_download  # noqa: PLC0415

        target_model = model_name or settings.base_model_name

        # If model is already loaded and matches, skip
        if cls._model is not None and cls._current_model_name == target_model:
            yield {
                "event": "progress",
                "stage": "loading",
                "message": "Model already cached",
                "progress": 100,
            }
            return

        # Progress tracking
        progress_queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()
        load_complete = threading.Event()
        load_error: list[Exception] = []

        # Track file download progress
        download_state = {
            "files_completed": 0,
            "total_files": 0,
            "current_file": "",
            "current_file_progress": 0,
        }

        def create_progress_tqdm_class(loop: asyncio.AbstractEventLoop):
            """Create a custom tqdm class that reports progress to our queue."""
            from tqdm import tqdm as BaseTqdm  # noqa: PLC0415

            class ProgressTqdm(BaseTqdm):
                """Custom tqdm that sends progress to asyncio queue."""

                def __init__(self, *args, **kwargs):
                    super().__init__(*args, **kwargs)
                    self._last_reported_progress = -1
                    # Extract filename from desc if available
                    self._file_name = kwargs.get("desc", "") or "file"
                    if hasattr(self._file_name, "__str__"):
                        self._file_name = str(self._file_name)

                    # Update current file in state
                    download_state["current_file"] = self._file_name
                    download_state["current_file_progress"] = 0

                def update(self, n=1):
                    super().update(n)
                    self._report_progress()

                def _report_progress(self):
                    if self.total and self.total > 0:
                        progress = int((self.n / self.total) * 100)
                        # Only report if progress changed (every 1%)
                        if progress != self._last_reported_progress:
                            self._last_reported_progress = progress
                            download_state["current_file_progress"] = progress

                            # Format sizes
                            downloaded = self._format_size(self.n)
                            total = self._format_size(self.total)
                            speed = self._format_speed()

                            # Calculate overall progress
                            # Each file contributes equally to total progress
                            total_files = max(download_state["total_files"], 1)
                            files_done = download_state["files_completed"]
                            overall_progress = int(
                                ((files_done * 100) + progress) / total_files
                            )

                            event = {
                                "event": "progress",
                                "stage": "downloading",
                                "message": f"Downloading {self._file_name}",
                                "file_name": self._file_name,
                                "progress": progress,
                                "overall_progress": overall_progress,
                                "files_completed": files_done,
                                "total_files": total_files,
                                "downloaded_size": downloaded,
                                "total_size": total,
                                "speed": speed,
                            }
                            asyncio.run_coroutine_threadsafe(
                                progress_queue.put(event), loop
                            )

                def _format_size(self, size_bytes):
                    """Format bytes to human readable string."""
                    for unit in ["B", "KB", "MB", "GB"]:
                        if abs(size_bytes) < 1024.0:
                            return f"{size_bytes:.1f}{unit}"
                        size_bytes /= 1024.0
                    return f"{size_bytes:.1f}TB"

                def _format_speed(self):
                    """Format download speed."""
                    if hasattr(self, "format_dict"):
                        rate = self.format_dict.get("rate")
                        if rate:
                            return f"{self._format_size(rate)}/s"
                    return ""

                def close(self):
                    # Report file completion
                    if self.total and self.n >= self.total:
                        download_state["files_completed"] += 1
                        asyncio.run_coroutine_threadsafe(
                            progress_queue.put(
                                {
                                    "event": "progress",
                                    "stage": "downloading",
                                    "message": f"Finished downloading {self._file_name}",
                                    "file_name": self._file_name,
                                    "progress": 100,
                                    "files_completed": download_state[
                                        "files_completed"
                                    ],
                                    "total_files": download_state["total_files"],
                                    "file_complete": True,
                                }
                            ),
                            loop,
                        )
                    super().close()

            return ProgressTqdm

        def load_in_thread(loop: asyncio.AbstractEventLoop):
            """Load model in a separate thread with progress tracking."""
            import huggingface_hub.file_download  # noqa: PLC0415

            ProgressTqdm = create_progress_tqdm_class(loop)

            # Monkey-patch huggingface_hub's tqdm to use our custom class
            # This is necessary because snapshot_download's tqdm_class only affects
            # the outer file list progress, not individual file downloads
            original_tqdm = huggingface_hub.file_download.tqdm
            huggingface_hub.file_download.tqdm = ProgressTqdm

            try:
                # Step 0: Get list of files to estimate total
                asyncio.run_coroutine_threadsafe(
                    progress_queue.put(
                        {
                            "event": "status",
                            "stage": "preparing",
                            "message": f"Checking {target_model}...",
                        }
                    ),
                    loop,
                )

                try:
                    # Count large files (model weights) that will be downloaded
                    repo_files = list_repo_files(target_model)
                    # Only count files that are likely to show progress bars
                    # (large files like .bin, .safetensors, .h5, etc.)
                    large_file_extensions = (
                        ".bin",
                        ".safetensors",
                        ".h5",
                        ".onnx",
                        ".pt",
                        ".pth",
                    )
                    large_files = [
                        f for f in repo_files if f.endswith(large_file_extensions)
                    ]
                    download_state["total_files"] = max(len(large_files), 1)
                except Exception:
                    # If we can't get file list, estimate based on typical model structure
                    download_state["total_files"] = 3

                # Step 1: Download all model files using snapshot_download
                asyncio.run_coroutine_threadsafe(
                    progress_queue.put(
                        {
                            "event": "status",
                            "stage": "downloading",
                            "message": f"Downloading {target_model} ({download_state['total_files']} files)...",
                        }
                    ),
                    loop,
                )

                # Use snapshot_download - our patched tqdm will capture individual file progress
                snapshot_download(
                    repo_id=target_model,
                    cache_dir=settings.model_cache_dir,
                )

                # Step 2: Load processor (should be from cache now)
                asyncio.run_coroutine_threadsafe(
                    progress_queue.put(
                        {
                            "event": "status",
                            "stage": "loading",
                            "message": "Loading processor...",
                        }
                    ),
                    loop,
                )

                cls._processor = AutoProcessor.from_pretrained(
                    target_model,
                    cache_dir=settings.model_cache_dir,
                    local_files_only=True,  # Use cached files
                )

                # Step 3: Load model (should be from cache now)
                asyncio.run_coroutine_threadsafe(
                    progress_queue.put(
                        {
                            "event": "status",
                            "stage": "loading",
                            "message": "Loading model weights...",
                        }
                    ),
                    loop,
                )

                cls._model = MusicgenForConditionalGeneration.from_pretrained(
                    target_model,
                    cache_dir=settings.model_cache_dir,
                    local_files_only=True,  # Use cached files
                )

                # Step 4: Move to GPU if available
                if torch.cuda.is_available():
                    asyncio.run_coroutine_threadsafe(
                        progress_queue.put(
                            {
                                "event": "status",
                                "stage": "loading",
                                "message": "Moving model to GPU...",
                            }
                        ),
                        loop,
                    )
                    cls._model = cls._model.to("cuda")

                cls._current_model_name = target_model
                cls._current_adapter_id = None

            except Exception as e:
                load_error.append(e)
            finally:
                # Restore original tqdm
                huggingface_hub.file_download.tqdm = original_tqdm
                load_complete.set()
                # Signal completion
                asyncio.run_coroutine_threadsafe(progress_queue.put(None), loop)

        # Start loading in thread
        loop = asyncio.get_event_loop()
        thread = threading.Thread(target=load_in_thread, args=(loop,))
        thread.start()

        # Yield progress events
        while True:
            try:
                event = await asyncio.wait_for(progress_queue.get(), timeout=0.5)
                if event is None:
                    # Thread signaled completion
                    break
                yield event
            except TimeoutError:
                # Send heartbeat to keep connection alive
                yield {
                    "event": "heartbeat",
                    "stage": "loading",
                    "message": "Loading...",
                }
                # Only check load_complete as a fallback
                if load_complete.is_set() and progress_queue.empty():
                    try:
                        event = await asyncio.wait_for(
                            progress_queue.get(), timeout=0.2
                        )
                        if event is None:
                            break
                        yield event
                    except TimeoutError:
                        break

        thread.join()

        if load_error:
            raise load_error[0]

    @classmethod
    async def load_adapter(cls, adapter_id: UUID | None, db: AsyncSession):
        if adapter_id == cls._current_adapter_id:
            return

        if cls._model is None:
            await cls.load_model()

        # Remove current adapter if any
        if cls._current_adapter_id is not None:
            try:
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
        async_session = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as db:
            try:
                # Get job
                result = await db.execute(
                    select(GenerationJob).where(GenerationJob.id == job_id)
                )
                job = result.scalar_one_or_none()

                if not job or cls.is_cancelled(job_id):
                    return

                # Update status
                job.status = JobStatus.PROCESSING
                await db.commit()

                # Get prompt
                result = await db.execute(
                    select(Prompt).where(Prompt.id == job.prompt_id)
                )
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
                    primary = attrs.get("primary_instruments")
                    secondary = attrs.get("secondary_instruments")
                    if primary:
                        prompt_text = f"{prompt_text} featuring {', '.join(primary)}"
                    if secondary:
                        prompt_text = (
                            f"{prompt_text} with subtle {', '.join(secondary)}"
                        )

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
