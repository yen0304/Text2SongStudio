# Design: Experiment Detail Page UX Improvements

## Problem Analysis

### 1. Page Length Issue

**Current Behavior**: The experiment detail page is a single scrollable container. As experiments accumulate more runs, the page grows indefinitely. The training log viewer is placed at the bottom of the runs table, requiring users to scroll down to see terminal output.

**Impact**: Users lose sight of the runs table when viewing logs, and vice versa. This creates a fragmented experience when monitoring training progress.

### 2. Terminal Switching Issue

**Current Behavior**: When clicking the terminal button on a run, the `viewingLogsRunId` state is set. The `TrainingLogViewer` component then loads logs via `logsApi.getLogs(runId)`. If a run just started and has no log entries yet, the component may not properly initialize or switch to the new run.

**Investigation Points**:
- The `useEffect` in `TrainingLogViewer.tsx` depends on `runId` - when it changes, it should reload
- If `response.data` is empty or null from `getLogs()`, the history load completes but shows nothing
- The issue may be that the UI doesn't switch because the parent component conditionally renders based on `viewingLogsRun` which depends on the run existing in `experiment?.runs`

**Root Cause Hypothesis**: The terminal instance doesn't clear previous content when switching runs. If the new run has empty logs, the old content remains, making it seem like the switch didn't happen.

### 3. Failed Run Deletion Issue

**Current Behavior**: There is no API endpoint or UI to delete individual experiment runs. The only delete operation is on experiments (which archives them).

**Data to Clean Up**:
1. Database: `experiment_runs` table record
2. Database: `training_logs` table record (has CASCADE on delete)
3. File System: `backend/adapters/{experiment_id}/{run_id}/` directory (may exist even for failed runs)
4. File System: `backend/exports/{dataset_id}/` - dataset exports (shared, should NOT be deleted)

## Proposed Solutions

### 1. Sticky Terminal Panel Layout

**Approach**: Use a split-pane layout where the terminal is in a fixed position panel.

```
┌─────────────────────────────────────────────────┐
│ Experiment Header                               │
├───────────────────────────────────┬─────────────┤
│ Overview Cards                    │             │
├───────────────────────────────────│  Terminal   │
│ Runs Table (scrollable)           │   Panel     │
│ - Run 1                           │  (sticky)   │
│ - Run 2                           │             │
│ - Run 3                           │             │
│ - ...                             │             │
│                                   │             │
└───────────────────────────────────┴─────────────┘
```

**Alternative**: Collapsible terminal panel that can be expanded/minimized, staying at the bottom of viewport.

**Chosen Solution**: Side-by-side split layout with:
- Left panel: scrollable experiment info and runs table
- Right panel: fixed terminal viewer with run selector tabs
- Responsive: Stack vertically on mobile

### 2. Terminal Switching Fix

**Approach**: 
1. Clear terminal content when `runId` changes
2. Show a loading indicator while fetching history
3. Handle empty log response gracefully (show "Waiting for logs..." message)
4. Ensure the parent component always renders the viewer when a run is selected, regardless of log state

**Implementation**:
- Add `terminal.clear()` call at the start of the `loadHistory` function
- Add "Waiting for logs..." placeholder when data is empty and run is live
- Fix any state management issues in the parent page

### 3. Run Deletion API and UI

**Approach**: Add hard delete capability for runs in specific states.

**Constraints**:
- Only allow deletion of runs in terminal states: `FAILED`, `COMPLETED`, `CANCELLED`
- Cannot delete `PENDING` or `RUNNING` runs
- Recalculate experiment's `best_run_id` and `best_loss` if deleted run was the best

**API Design**:
```
DELETE /experiments/{experiment_id}/runs/{run_id}

Response: 204 No Content

Error Cases:
- 404: Experiment or run not found
- 400: Cannot delete running/pending runs
```

**Cleanup Steps**:
1. Delete adapter directory if exists: `./adapters/{experiment_id}/{run_id}/`
2. Delete run record (training_logs deleted via CASCADE)
3. Update experiment best_run_id if needed

**UI Design**:
- Add delete button (trash icon) to run row, visible only for failed/completed/cancelled runs
- Confirmation dialog before deletion
- Show success toast after deletion

## Dependencies

- No external dependencies required
- All changes are additive to existing functionality

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout breaks on small screens | Medium | Medium | Implement responsive breakpoints, test on mobile |
| Deleting wrong run accidentally | Low | High | Require confirmation dialog with run name |
| Orphaned adapter files | Low | Low | Add cleanup script for manual recovery |

## Open Questions

1. Should we support batch deletion of multiple runs?
   - **Decision**: No, start with single deletion. Batch can be added later.

2. Should completed runs be deletable, or only failed ones?
   - **Decision**: Allow both, as users may want to clean up test runs.

3. Should the terminal panel be resizable?
   - **Decision**: Yes, use a draggable divider for flexibility.
