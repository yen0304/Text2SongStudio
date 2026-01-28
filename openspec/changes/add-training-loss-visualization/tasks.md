# Tasks: Add Training Loss Visualization

## Implementation Order

Tasks are ordered to deliver incremental value and minimize risk.

### Phase 1: Backend Metric Infrastructure

- [ ] **1.1 Create metric parsing utilities**
  - Add regex patterns for extracting loss, learning rate, step number from log lines
  - Handle both supervised and DPO training formats
  - Write unit tests for parsing functions
  - Location: `backend/app/services/metric_parser.py` (new file)

- [ ] **1.2 Integrate metric parsing into log capture**
  - Modify `LogCaptureService` to call parser on each log chunk
  - Batch metric updates to avoid excessive DB writes
  - Handle parsing errors gracefully (log and continue)
  - Location: `backend/app/services/log_capture.py`

- [ ] **1.3 Add metrics API endpoint**
  - Create `GET /experiments/{experiment_id}/runs/{run_id}/metrics`
  - Return metrics from `ExperimentRun.metrics` JSON field
  - Support optional query parameters (metric_type, step range)
  - Add response schema to `backend/app/schemas/experiment.py`
  - Location: `backend/app/routers/experiments.py`

- [ ] **1.4 Test backend metrics end-to-end**
  - Integration test: start training, verify metrics captured
  - Test API endpoint returns correct format
  - Verify metrics persist after training completes
  - Location: `backend/tests/services/test_metric_parsing.py` (new file)

### Phase 2: Frontend Chart Component

- [ ] **2.1 Create base TrainingMetricsChart component**
  - Build React component with Recharts LineChart
  - Accept runId and metricType as props
  - Implement loading and error states
  - Add empty state for runs without metrics
  - Location: `frontend/src/components/training/TrainingMetricsChart.tsx` (new file)

- [ ] **2.2 Add API client methods**
  - Add `getRunMetrics` method to experiments API module
  - Define TypeScript types for metrics response
  - Location: `frontend/src/lib/api/modules/experiments.ts`
  - Location: `frontend/src/lib/api/types/experiments.ts`

- [ ] **2.3 Implement data fetching with polling**
  - Use React Query for automatic refetching
  - Enable polling when `isLive=true`
  - Handle stale data and cache invalidation
  - Location: `frontend/src/components/training/TrainingMetricsChart.tsx`

- [ ] **2.4 Style and polish chart component**
  - Match existing UI theme (colors, typography)
  - Add responsive sizing
  - Implement hover tooltips with exact values
  - Add axis labels and legend
  - Location: `frontend/src/components/training/TrainingMetricsChart.tsx`

### Phase 3: UI Integration

- [ ] **3.1 Integrate chart into Runs tab**
  - Add chart component below terminal in experiment detail page
  - Pass viewingLogsRunId and live status
  - Ensure layout doesn't break with chart added
  - Location: `frontend/src/app/experiments/[id]/page.tsx`

- [ ] **3.2 Add metric type selector**
  - Add dropdown/tabs to switch between loss, lr, grad_norm
  - Persist selection in component state
  - Update chart when selection changes
  - Location: `frontend/src/app/experiments/[id]/page.tsx`

- [ ] **3.3 Handle edge cases**
  - Show appropriate message for runs without metrics (old runs)
  - Handle runs with partial metrics (training interrupted)
  - Display loading state during initial fetch
  - Location: `frontend/src/components/training/TrainingMetricsChart.tsx`

### Phase 4: Multi-Run Comparison

- [ ] **4.1 Support multiple runs in chart component**
  - Modify component to accept array of runIds
  - Fetch metrics for all runs in parallel
  - Render multiple lines with distinct colors
  - Update legend to show all runs
  - Location: `frontend/src/components/training/TrainingMetricsChart.tsx`

- [ ] **4.2 Integrate into comparison view**
  - Add metrics chart to RunComparison component
  - Pass selected runs from experiment page
  - Ensure chart displays correctly in comparison modal
  - Location: `frontend/src/components/comparison/RunComparison.tsx`

### Phase 5: Testing & Validation

- [ ] **5.1 Write component tests**
  - Test chart renders with mock data
  - Test empty state and error states
  - Test polling behavior with fake timers
  - Location: `frontend/src/__tests__/components/training/TrainingMetricsChart.test.tsx` (new file)

- [ ] **5.2 Manual testing**
  - Start training run, verify chart updates in real-time
  - Complete training, verify chart shows full history
  - Test with multiple concurrent runs
  - Test run comparison with 2-3 runs
  - Verify performance with 1000+ data points

- [ ] **5.3 Update documentation**
  - Add metrics visualization to user guide
  - Document metric parsing patterns in code comments
  - Update CHANGELOG.md with new feature

## Validation Criteria

Each task should be verified with:

- **Code Quality**: Passes linting, type checking, formatting
- **Tests**: Unit/integration tests pass for backend changes
- **Functionality**: Manual testing confirms expected behavior
- **UI/UX**: Frontend changes match design specs, are responsive
- **Performance**: No noticeable slowdown in page load or rendering
- **Backward Compatibility**: Existing features continue working

## Dependencies

- Task 2.x depends on 1.3 (API endpoint must exist)
- Task 3.x depends on 2.x (component must be built)
- Task 4.x depends on 3.1 (single-run chart must work first)
- Task 5.2 depends on all implementation tasks

## Estimated Timeline

- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 1-2 days
- Phase 4: 1-2 days
- Phase 5: 1 day

**Total**: ~7-11 days for one developer

## Parallelization Opportunities

- Task 1.1-1.2 (backend parsing) can proceed independently of 2.1 (frontend component scaffold)
- Task 2.1 (component structure) can start before 1.3 (API) by using mock data
- Tasks 5.1 (component tests) and 5.3 (docs) can happen in parallel with 5.2 (manual testing)
