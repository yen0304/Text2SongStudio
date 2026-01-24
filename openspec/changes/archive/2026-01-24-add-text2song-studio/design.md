# Design: Text2Song Studio Platform

## Context

Text2Song Studio is an open-source, human-in-the-loop text-to-music generation platform. The system must support:
- Multiple concurrent users submitting prompts and providing feedback
- Asynchronous audio generation (GPU-bound, potentially minutes per sample)
- Large audio file storage and streaming
- Continuous model improvement through adapter training

### Stakeholders
- **Researchers**: Need reproducible training workflows and dataset export
- **Musicians/Creators**: Need intuitive prompt editing and audio comparison tools
- **ML Engineers**: Need adapter management and training infrastructure

### Constraints
- Audio generation is slow (10-60 seconds per sample on consumer GPU)
- Audio files are large (10-30 MB per minute of audio)
- Training requires GPU resources separate from inference
- Must work with open-source models only (no proprietary APIs)

## Goals / Non-Goals

### Goals
- Enable iterative model improvement through structured human feedback
- Treat LoRA adapters as first-class, versioned artifacts
- Decouple frontend, backend, and model layers for independent scaling
- Support both single-user local deployment and multi-user server deployment
- Maintain reproducibility of datasets and training runs

### Non-Goals
- Real-time audio generation (streaming during inference)
- Mobile application support
- Multi-model ensemble inference
- Audio editing or post-processing features
- Commercial licensing or monetization features

## Decisions

### D1: Asynchronous Job Architecture

**Decision**: Use a job queue pattern for audio generation with polling-based status updates.

**Rationale**: Audio generation takes 10-60 seconds per sample. Synchronous HTTP requests would timeout and block server threads. A job queue allows:
- Multiple samples per prompt to be generated in parallel (GPU permitting)
- Progress tracking and cancellation
- Retry logic for transient failures

**Alternatives considered**:
- WebSocket streaming: More complex, overkill for simple status updates
- Server-Sent Events: Good middle ground but job queue still needed

**Implementation**: FastAPI background tasks for simple cases; Redis + Celery for production deployments.

### D2: Audio Storage Strategy

**Decision**: Store audio files in S3-compatible object storage with PostgreSQL metadata.

**Rationale**:
- Audio files are large and immutable
- Object storage provides efficient streaming and CDN integration
- PostgreSQL handles relational queries (prompt-audio-feedback relationships)
- MinIO provides local S3-compatible storage for development

**Alternatives considered**:
- Filesystem storage: Harder to scale, no CDN integration
- PostgreSQL BLOB: Inefficient for large binary data

### D3: Adapter-Centric Model Layer

**Decision**: Load base model once, swap LoRA adapters dynamically per request.

**Rationale**:
- Base model (MusicGen) is large (several GB)
- LoRA adapters are small (10-100 MB)
- PEFT library supports efficient adapter merging/unmerging
- Enables A/B testing between adapters without model reload

**Alternatives considered**:
- Multiple model instances: Memory prohibitive
- Full model fine-tuning: Storage prohibitive, loses adapter composability

### D4: Feedback Data Model

**Decision**: Store feedback as structured tuples (prompt, audio_id, rating, preference_pair, tags, timestamp, user_id).

**Rationale**:
- Supports both pointwise (rating) and pairwise (preference) training signals
- Tags enable filtering for specialized adapter training
- User ID enables per-user preference modeling (future)
- Timestamp enables temporal analysis of preference drift

### D5: Training Pipeline Separation

**Decision**: Training runs as a separate process/service, not within the API server.

**Rationale**:
- Training is GPU-intensive and long-running (hours)
- Training should not block inference capacity
- Enables training on different hardware (cloud GPU instances)
- Dataset export allows training anywhere

**Implementation**: CLI tool for local training; optional training service for automated retraining.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Prompt Editor  │  Audio Player  │  Feedback UI  │  Adapter Mgmt │
└────────┬────────┴───────┬────────┴───────┬───────┴───────┬───────┘
         │                │                │               │
         ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│  /prompts  │  /generate  │  /feedback  │  /adapters  │  /datasets│
└─────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴─────┬─────┘
      │             │             │             │            │
      ▼             ▼             ▼             ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│PostgreSQL│  │Job Queue │  │PostgreSQL│  │Adapter   │  │Dataset  │
│ (prompts)│  │(gen jobs)│  │(feedback)│  │Registry  │  │Builder  │
└──────────┘  └────┬─────┘  └──────────┘  └────┬─────┘  └────┬────┘
                   │                           │             │
                   ▼                           ▼             ▼
         ┌──────────────────────────────────────────────────────┐
         │              Model Layer (PyTorch)                    │
         ├──────────────────────────────────────────────────────┤
         │  MusicGen Base  │  LoRA Adapters  │  Training Loop   │
         └─────────────────┴─────────────────┴──────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │              Storage Layer                            │
         ├──────────────────────────────────────────────────────┤
         │  S3/MinIO (audio files)  │  Filesystem (adapters)    │
         └──────────────────────────────────────────────────────┘
```

## Data Models

### Prompt
```
id: UUID
text: string (natural language description)
attributes: JSON {style, tempo, instrumentation, mood, duration}
created_at: timestamp
user_id: UUID (optional)
```

### AudioSample
```
id: UUID
prompt_id: UUID (FK)
adapter_id: UUID (FK, nullable)
storage_path: string (S3 key)
duration_seconds: float
sample_rate: int
created_at: timestamp
generation_params: JSON {seed, temperature, top_k, etc.}
```

### Feedback
```
id: UUID
user_id: UUID (optional)
audio_id: UUID (FK)
rating: float (1-5 scale, nullable)
preferred_over: UUID (FK to AudioSample, nullable)
tags: string[]
notes: text (optional)
created_at: timestamp
```

### Adapter
```
id: UUID
name: string (unique)
version: string (semver)
description: text
base_model: string (e.g., "facebook/musicgen-small")
storage_path: string
training_dataset_id: UUID (FK, nullable)
training_config: JSON
created_at: timestamp
is_active: boolean
```

### Dataset
```
id: UUID
name: string
description: text
type: enum {supervised, preference}
filter_query: JSON (criteria used to build dataset)
sample_count: int
created_at: timestamp
export_path: string (nullable)
```

## API Endpoints (Summary)

### Prompts
- `POST /prompts` - Create prompt
- `GET /prompts/{id}` - Get prompt details
- `GET /prompts` - List prompts (paginated)

### Generation
- `POST /generate` - Submit generation job
- `GET /generate/{job_id}` - Get job status and results
- `DELETE /generate/{job_id}` - Cancel job

### Audio
- `GET /audio/{id}` - Get audio metadata
- `GET /audio/{id}/stream` - Stream audio file
- `GET /audio/compare` - Get multiple samples for comparison

### Feedback
- `POST /feedback` - Submit feedback
- `GET /feedback` - List feedback (filtered)
- `GET /feedback/stats` - Aggregated feedback statistics

### Adapters
- `GET /adapters` - List available adapters
- `POST /adapters` - Register new adapter
- `GET /adapters/{id}` - Get adapter details
- `PATCH /adapters/{id}` - Update adapter (activate/deactivate)

### Datasets
- `POST /datasets` - Create dataset from feedback
- `GET /datasets/{id}` - Get dataset info
- `POST /datasets/{id}/export` - Export for training

## Risks / Trade-offs

### R1: GPU Memory Constraints
**Risk**: Loading base model + multiple adapters may exceed GPU memory.
**Mitigation**: Load one adapter at a time; queue requests for different adapters; document minimum GPU requirements (16GB+ VRAM recommended).

### R2: Long Generation Times
**Risk**: Users may abandon sessions during long waits.
**Mitigation**: Show progress indicators; allow multiple concurrent jobs; implement job prioritization.

### R3: Feedback Quality
**Risk**: Noisy or inconsistent human feedback degrades training signal.
**Mitigation**: Implement inter-rater agreement metrics; allow feedback filtering by user reliability; support expert-only datasets.

### R4: Adapter Compatibility
**Risk**: Adapters trained on different base model versions may be incompatible.
**Mitigation**: Store base model version with adapter metadata; validate compatibility before loading; version adapters strictly.

## Migration Plan

Not applicable - greenfield project.

## Open Questions

1. **Multi-GPU support**: Should the system support distributing generation across multiple GPUs? (Deferred to future capability)

2. **User authentication**: What authentication system should be used? (Recommend starting with simple API keys, add OAuth later)

3. **Adapter composition**: Should multiple adapters be composable in a single inference? (PEFT supports this but adds complexity)

4. **Real-time collaboration**: Should multiple users be able to provide feedback on the same session simultaneously? (Deferred)
