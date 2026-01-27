# Change: Improve Experiment Detail Page UX

## Why

The experiment detail page has usability issues as the number of training runs grows:
1. The page becomes very long with many runs, pushing the terminal/logs viewer far down
2. Terminal switching may fail when the target run has no logs yet (empty log buffer)
3. Failed runs cannot be deleted, leaving orphaned data in both database and file storage (adapters directory)

## What Changes

- **UI Layout**: Redesign experiment detail page to use a fixed/sticky terminal panel that stays visible regardless of scroll position
- **Terminal Switching**: Fix terminal viewer to properly switch to runs with empty logs
- **Run Deletion**: Add ability to delete failed runs with proper cleanup of associated data (database records, log files, adapter directories)

## Impact

- Affected specs: `experiment-management`
- Affected code:
  - Frontend: `frontend/src/app/experiments/[id]/page.tsx`, `frontend/src/components/training/TrainingLogViewer.tsx`
  - Backend: `backend/app/routers/experiments.py`, `backend/app/services/training.py`
  - API: New endpoint `DELETE /experiments/{id}/runs/{run_id}`
