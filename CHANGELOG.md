# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Prompt Templates & Favorites System** (2026-01-29)
  - New `prompt_templates` table for reusable prompt configurations
  - New `favorites` table with polymorphic design (supports prompts and audio)
  - PostgreSQL full-text search with tsvector index on prompts
  - 6 built-in system templates (Electronic Dance, Ambient Chill, Cinematic Epic, Jazz Lounge, Pop Upbeat, Classical Piano)
  - Backend API: `/templates` CRUD with category filtering
  - Backend API: `/favorites` CRUD with check/toggle endpoints
  - Backend API: `GET /prompts/search` with FTS and attribute filters
  - Frontend: `TemplateSelector` component with system/user templates
  - Frontend: `SaveTemplateDialog` for saving prompts as templates
  - Frontend: `FavoriteButton` toggle component
  - Frontend: `/favorites` page with tabs (All/Prompts/Audio)
  - Frontend: `PromptSearchBar` with style, mood, tempo filters
  - Sidebar navigation: Favorites quick access (Heart icon)
- **Training Loss Visualization** (2026-01-28)
  - Real-time training metric visualization on experiment detail page
  - New `TrainingMetricsChart` component with line charts using Recharts
  - Supports loss, learning_rate, grad_norm, and DPO-specific metrics
  - Live polling during active training runs
  - Multi-run comparison with overlaid curves
  - Metric type selector to switch between different metrics
  - Backend metric parsing service extracting metrics from training logs
  - New API endpoint: `GET /experiments/{id}/runs/{run_id}/metrics`
  - Automatic metric downsampling for large training runs (2000+ points)
- **Adapter Rename Functionality** (2026-01-28)
  - Inline edit on adapter detail page - click name to edit
  - Rename dialog on adapter list page via pencil icon button
  - Name validation (1-100 characters, non-empty)
  - New `Dialog` UI component (`@radix-ui/react-dialog`)
- **Feedback System Refactoring to RLHF Industry Standard** (2026-01-26)
  - New `quality_ratings` table for Supervised Fine-Tuning (SFT) data
  - New `preference_pairs` table for Direct Preference Optimization (DPO) with same-prompt enforcement
  - New `audio_tags` table for flexible filtering and categorization
  - New API endpoints: `/ratings`, `/preferences`, `/tags`
  - Frontend API modules: `ratingsApi`, `preferencesApi`, `tagsApi`
  - Alembic migration with automatic data migration from legacy `feedback` table
  - Dockerfile updated to run migrations automatically on startup
- **Backend Testing Infrastructure** (2025-01-25)
  - Comprehensive test suite with 243 tests achieving 60.94% coverage (target: 50%)
  - Schema tests for all Pydantic models (prompt, feedback, adapter, dataset, experiment, generation)
  - Router tests for API endpoints with mocked database
  - Service tests for storage and dataset services with mocked dependencies
  - Config tests for Settings validation and URL conversion
  - Mock fixtures for database, storage, and model instances in conftest.py
  - pytest-cov configuration in pyproject.toml with 50% coverage threshold
  - Excludes LLM/HuggingFace related code (generation.py) from coverage requirements
- Initial project structure
- FastAPI backend with audio generation endpoints
- Next.js frontend with prompt editor and audio player
- Human feedback collection system (rating, preference, tags)
- LoRA adapter management and registry
- Dataset construction pipelines
- Training scripts for supervised and preference-based fine-tuning
- Docker Compose configuration for local development
- PostgreSQL database integration
- Audio storage with local and S3 support

### Changed (2025-01-24 - Dashboard UI Redesign)
- **BREAKING**: Complete UI redesign from music player to model tuning dashboard
- New sidebar navigation with 8 sections: Overview, Generate, Jobs, Experiments, Adapters, A/B Tests, Datasets, Settings
- New Pipeline visualization showing Generate → Feedback → Dataset → Training workflow
- New Job Queue page with real-time status monitoring and filtering
- New Experiment management with runs tracking and metrics visualization
- New Adapter version history with timeline view
- New A/B Testing comparison player with blind evaluation mode
- New Metrics endpoints for dashboard statistics
- Enhanced Adapter API with version management
- Audio player now embedded in Job/Run detail pages instead of dedicated page
- Route changes: `/` → `/overview`, original homepage → `/generate`, `/training` → `/datasets`

### Deprecated
- `feedbackApi` module - Use `ratingsApi`, `preferencesApi`, and `tagsApi` instead
- `/feedback` API endpoint - Use `/ratings`, `/preferences`, `/tags` endpoints instead
- `Feedback` model pointing to `feedback_legacy` table - Use new models instead

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.1.0] - 2026-01-25

### Added
- Initial release
- Core audio generation functionality using MusicGen
- Web-based prompt editor with structured attribute support
- Audio playback with waveform visualization
- Basic feedback collection (rating system)
- RESTful API for all operations
- Docker containerization

---

[Unreleased]: https://github.com/your-org/text2song-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/text2song-studio/releases/tag/v0.1.0
