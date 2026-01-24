# Change: Add Text2Song Studio Platform

## Why

There is no existing open-source platform that combines text-to-music generation with a human-in-the-loop feedback system for iterative model improvement. Current text-to-music tools treat generation as a one-shot task without structured feedback collection or adapter-based fine-tuning workflows. This project addresses the need for a full lifecycle system that connects prompt design, music generation, human evaluation, dataset construction, and parameter-efficient fine-tuning.

## What Changes

### New Capabilities

- **Prompt Management**: Text prompt editor supporting natural language and structured musical attributes (style, tempo, instrumentation, mood) with validation and storage
- **Audio Generation**: Multi-sample generation using base models (MusicGen) with optional LoRA adapter selection, job management, and audio storage
- **Feedback Collection**: Human feedback interfaces for rating (musicality, coherence, emotional alignment), preference selection (A/B ranking), and qualitative annotations
- **Dataset Construction**: Pipelines to transform feedback data into supervised and preference-ranking training datasets
- **LoRA Adapter Management**: Registry and versioning system for LoRA adapters as first-class, composable artifacts
- **Training Pipeline**: Parameter-efficient fine-tuning workflows using PEFT/LoRA with support for supervised and preference-based learning

### Architecture Layers

1. **Frontend (React/Next.js)**: Web UI for prompt editing, audio playback with waveform visualization, feedback collection, and adapter selection
2. **Backend (FastAPI)**: API for prompt ingestion, generation orchestration, feedback storage, and adapter registry
3. **Model Layer (PyTorch)**: MusicGen integration, LoRA adapter loading, and training infrastructure

## Impact

- Affected specs: None (greenfield project)
- Affected code: New codebase to be created
- New dependencies:
  - Frontend: React, Next.js, Tailwind CSS, shadcn/ui, wavesurfer.js
  - Backend: FastAPI, PyTorch, torchaudio, librosa, PEFT
  - Storage: PostgreSQL, S3-compatible storage (MinIO)
  - Models: MusicGen (Meta), Hugging Face transformers
