# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- N/A

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
