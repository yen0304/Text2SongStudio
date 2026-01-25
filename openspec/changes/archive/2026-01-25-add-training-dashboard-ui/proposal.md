# Proposal: Add Training Dashboard UI

## Summary

Add a comprehensive training dashboard UI to enable users to manage datasets, monitor training jobs, and select LoRA adapters - all from the web interface without requiring CLI commands.

## Motivation

Currently, the backend has full API support for:
- Dataset creation, listing, and export (`/datasets`)
- Adapter registration, listing, and management (`/adapters`)
- Training job execution (via CLI)

However, the frontend only has:
- Prompt Editor
- Audio Player
- Feedback Panel

Users must use CLI/curl commands to create datasets and manage adapters, which breaks the "human-in-the-loop" workflow and creates friction in the training loop.

## Goals

1. Enable users to create and export training datasets from collected feedback via UI
2. Allow users to browse and select LoRA adapters for generation
3. Provide visibility into feedback collection progress toward training readiness
4. Follow vercel-react-best-practices for performance optimization

## Non-Goals

- Training job execution from UI (keep as CLI for v1)
- Real-time training progress monitoring (future enhancement)
- Multi-user authentication and permissions

## Solution Overview

Add a new "Training" page with three tabs:
1. **Datasets** - Create, view, and export training datasets
2. **Adapters** - Browse, activate, and select adapters for generation
3. **Progress** - View feedback collection statistics and training readiness

### UI Components

```
/training (new page)
├── Tab: Datasets
│   ├── DatasetList - List existing datasets with stats
│   ├── DatasetCreateForm - Create new dataset with filters
│   └── DatasetExportDialog - Export dataset for training
├── Tab: Adapters  
│   ├── AdapterList - List registered adapters
│   ├── AdapterCard - Display adapter details and stats
│   └── AdapterSelector - Select adapter for generation (also on main page)
└── Tab: Progress
    ├── FeedbackStats - Show feedback collection progress
    └── TrainingReadiness - Indicate when enough data for training
```

### Integration Points

- **Main page**: Add adapter selector to PromptEditor
- **FeedbackPanel**: Show progress toward next training milestone
- **API client**: Add missing endpoints to `lib/api.ts`

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Large bundle size from new components | Use dynamic imports for training page |
| Complex state management | Use SWR for data fetching with deduplication |
| Slow dataset preview | Use pagination and virtual scrolling |

## Success Criteria

1. Users can create a supervised dataset from UI with min_rating filter
2. Users can export dataset and see CLI command for training
3. Users can select an adapter when generating audio
4. All interactions complete without page refresh (SPA behavior)
