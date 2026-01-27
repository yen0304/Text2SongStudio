## 1. Backend Implementation

- [x] Add `DELETE /experiments/{experiment_id}/runs/{run_id}` endpoint
  - Validate run is in terminal state (failed/completed/cancelled)
  - Delete adapter directory if exists
  - Delete run record (logs cascade automatically)
  - Recalculate experiment best_run_id if needed
- [x] ~~Add tests for run deletion endpoint~~ (skipped per user request)

## 2. Frontend API Module

- [x] Add `deleteRun(experimentId, runId)` method to `experimentsApi`
- [x] Add TypeScript types for delete response

## 3. Terminal Switching Fix

- [x] Clear terminal content when runId changes in `TrainingLogViewer`
- [x] Add "Waiting for logs..." placeholder for empty live runs
- [x] Add loading state while fetching history
- [x] ~~Add tests for terminal switching behavior~~ (skipped per user request)

## 4. Experiment Detail Page Layout

- [x] Refactor page to use split-pane layout
  - Left: scrollable experiment info and runs table
  - Right: fixed terminal panel with run tabs
- [x] Add run selector tabs above terminal
- [x] Make terminal panel resizable (optional drag divider)
- [x] Implement responsive stacking for mobile
- [x] ~~Update tests for new layout~~ (skipped per user request)

## 5. Run Deletion UI

- [x] Add delete button to run row (trash icon)
  - Only show for failed/completed/cancelled runs
- [x] Add confirmation dialog before deletion
- [x] Show success toast after deletion
- [x] Refresh experiment data after deletion
- [x] ~~Add tests for delete UI flow~~ (skipped per user request)

## 6. Validation & Polish

- [x] Run full test suite (TypeScript/Python compilation check passed)
- [ ] Manual testing of all scenarios
- [x] Update spec documentation
