# Project Context

## Purpose

Text2Song Studio is an open-source, human-in-the-loop text-to-music generation platform designed to support iterative model improvement, controllable music generation, and preference-driven training workflows. The system connects prompt design, music generation, human evaluation, dataset construction, and parameter-efficient fine-tuning into a cohesive lifecycle.

## Tech Stack

### Frontend
- Next.js (React framework)
- Tailwind CSS / shadcn/ui (styling)
- wavesurfer.js (audio waveform visualization)

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PyTorch (ML framework)
- torchaudio, librosa (audio processing)
- uv (Python package and project manager)

### Model & Training
- MusicGen (Meta's text-to-music model)
- PEFT / LoRA (parameter-efficient fine-tuning)

### Storage
- PostgreSQL (metadata, feedback)
- S3-compatible storage / MinIO (audio files)

## Project Conventions

### Code Style
- Python: Follow PEP 8, use type hints, format with Black
- TypeScript/React: ESLint + Prettier, functional components with hooks
- Use meaningful variable names; avoid abbreviations

### Architecture Patterns
- Backend: FastAPI routers → services → repositories → models
- Frontend: Pages → Components → Hooks → API clients
- Decouple model layer from API layer
- Use dependency injection for testability

### Testing Strategy
- Backend: pytest with fixtures, aim for service-level coverage
- Frontend: React Testing Library for component tests
- E2E: Playwright for critical user flows
- Model tests: Validate adapter loading and inference correctness

### Git Workflow
- Branch naming: `feature/`, `fix/`, `refactor/` prefixes
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- PRs require passing CI and review

## Domain Context

### Key Concepts
- **Prompt**: Text description of desired music (natural language + structured attributes)
- **AudioSample**: Generated audio file with metadata
- **Feedback**: Human evaluation (ratings, preferences, tags)
- **Dataset**: Collection of feedback data prepared for training
- **Adapter**: LoRA weights trained for specific musical characteristics
- **Generation Job**: Async task for producing audio from a prompt

### Workflow
1. User creates prompt with musical description
2. System generates multiple audio samples (optionally with adapter)
3. User provides feedback (rate, compare, annotate)
4. System constructs training datasets from feedback
5. Training produces new/improved adapters
6. Adapters are deployed for future generation

## Important Constraints

- Audio generation is GPU-bound and slow (10-60 seconds per sample)
- Must work with open-source models only (no proprietary APIs)
- Audio files are large; storage must be efficient and streamable
- Training must run separately from inference to avoid resource contention

## External Dependencies

- Hugging Face Hub: Model and adapter distribution
- MinIO or S3: Object storage for audio files
- PostgreSQL: Relational database for all metadata
