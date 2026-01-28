# Design: Training Loss Visualization

## Architecture Overview

This change adds training metric visualization by enhancing the log capture system to parse and store structured metrics, then displaying them via a NEW chart component on the frontend. **All existing functionality remains unchanged.**

```
Training Process → stdout/stderr → Log Capture Service → Parse Metrics → Store in DB
                                    ↓ (unchanged)         ↓ (new, additive)
                            Existing Terminal Display     New Chart Component
                                                                ↓
Frontend Chart Component ← API Endpoint ← ExperimentRun.metrics (JSON)
       (new)                  (new)              (existing field, populated)
```

**Key principle**: This is purely additive. No existing code, UI, or functionality is modified.

## Component Design

### 1. Backend Metric Parsing

**Location**: `backend/app/services/log_capture.py` (modify existing file to add parsing)

**Modification approach**: Add new parsing logic without changing existing log capture flow

**Pattern Matching**:
```python
# Example log lines to parse:
# "Step 100: loss=1.2345, lr=1.00e-04"
# "Epoch 2 average loss: 1.1234"
# INFO - Step 50: loss=1.5678, lr=5.00e-05

METRIC_PATTERNS = {
    'step_loss': r'Step (\d+).*?loss[=:]?\s*([\d.]+)',
    'epoch_loss': r'Epoch (\d+).*?loss[=:]?\s*([\d.]+)',
    'learning_rate': r'lr[=:]?\s*([\d.e+-]+)',
    'grad_norm': r'grad_norm[=:]?\s*([\d.]+)',
}
```
 (field already exists, currently empty/null)
- Keep metrics grouped by type (loss, lr, grad_norm)
- Include timestamp for each data point
- Limit stored points (e.g., keep every Nth point for long runs)
- **Existing log storage in `TrainingLog` table remains completely unchanged**
- Include timestamp for each data point
- Limit stored points (e.g., keep every Nth point for long runs)

**Update Trigger**:
- Parse each log chunk as it's captured
- Batch database updates (e.g., every 5-10 log chunks)
- Avoid excessive DB writes while maintaining near-real-time updates

### 2. Metrics API Endpoint

**Endpoint**: `GET /experiments/{experiment_id}/runs/{run_id}/metrics`

**Response Format**:
```json
{
  "run_id": "uuid",
  "metrics": {
    "loss": [
      {"step": 1, "value": 2.34, "timestamp": "2026-01-28T12:00:00Z"},
      {"step": 10, "value": 2.21, "timestamp": "2026-01-28T12:00:15Z"}
    ],
    "learning_rate": [...],
    "grad_norm": [...]
  },
  "metadata": {
    "last_updated": "2026-01-28T12:05:00Z",
    "is_complete": false
  }
}
```

**Query Parameters**:
- `metric_type` (optional): Filter to specific metric (loss, lr, etc.)
- `min_step`, `max_step` (optional): Range filtering for large datasets

**Implementation**:
```python
# backend/app/routers/experiments.py or new metrics.py
@router.get("/experiments/{experiment_id}/runs/{run_id}/metrics")
async def get_run_metrics(
    experiment_id: UUID,
    run_id: UUID,
    metric_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    run = await db.get(ExperimentRun, run_id)
    # ... validation ...
    
    metrics = run.metrics or {}
    if metric_type:
        metrics = {metric_type: metrics.get(metric_type, [])}
    
    return {
        "run_id": str(run.id),
        "metrics": metrics,
        "metadata": {
            "last_updated": run.updated_at,
            "is_complete": run.status in ["completed", "failed", "cancelled"],
        }
    }
```

### 3. Frontend Chart Component

**Component**: `frontend/src/components/training/TrainingMetricsChart.tsx`

**Props**:
```typescript
interface TrainingMetricsChartProps {
  runId: string;
  metricType?: 'loss' | 'learning_rate' | 'grad_norm';
  height?: string;
  isLive?: boolean; // If true, poll for updates
}
```

**Features**:
- Line chart using Recharts
- Auto-refresh when `isLive=true` (every 3-5 seconds)
- Hover tooltips showing exact values
- Responsive sizing
- Loading and error states
- Empty state for runs without metrics

**Data Fetching**:
```typescript
// Use React Query for automatic polling
const { data, isLoading } = useQuery({
  queryKey: ['runMetrics', runId, metricType],
  queryFn: () => experimentsApi.getRunMetrics(runId, metricType),
  refetchInterval: isLive ? 3000 : false,
  staleTime: isLive ? 0 : 30000,
});
```

**Chart Configuration**:
- X-axis: Training step
- Y-axis: Metric value (auto-scaled)
- Multiple series for multi-run comparison
- Color-coded by run
- Legend showing run names and final values

### 4. Integration Points

**Experiment Detail Page** ([id]/page.tsx):
```tsxNEW section below existing terminal, do NOT modify terminal
{/* Existing terminal - UNCHANGED */}
<div className="border-t border-zinc-700 bg-[#1a1b26] rounded-b-lg">
  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
    {/* ... existing terminal header ... */}
  </div>
  <div>
    {viewingLogsRun ? (
      <TrainingLogViewer
        key={viewingLogsRun.id}
        runId={viewingLogsRun.id}
        isLive={viewingLogsRun.status === 'running'}
        height="400px"
      />
   Add NEW metrics chart to existing comparison modal
// Do NOT modify existing comparison table/content
<div className="mt-6">
  <h3>Metric Comparison</h3>
  <TrainingMetricsChart
    runIds={selectedRuns} // Modified to accept array
    metricType="loss"
    height="400px"
    isLive={false}
  />
</div/div>

{/* NEW: Add chart section below terminal */}
<div className="border-t mt-4nal in Runs tab
<div className="border-t">
  <TrainingMetricsChart
    runId={viewingLogsRunId}
    metricType="loss"
    height="300px"
    isLive={viewingLogsRun?.status === 'running'}
  />
</div>
```

**Run Comparison View** (RunComparison.tsx):
```tsx
// Overlay multiple runs on same chart
<TrainingMetricsChart
  runIds={selectedRuns} // Modified to accept array
  metricType="loss"
  height="400px"
  isLive={false}
/>
```

## Data Flow

### During Training
1. Training process outputs: `Step 100: loss=1.2345, lr=1.00e-04`
2. Log capture service reads from subprocess stdout
3. Parser extracts: `{step: 100, loss: 1.2345, lr: 1.00e-04}`
4. Metric appended to run.metrics JSON
5. Database updated (batched every ~10 new metrics)
6. Frontend polls metrics endpoint every 3 seconds
7. Chart updates with new data points

### After Training
1. Frontend loads full metrics on page load
2. No polling (isLive=false)
3. Chart shows complete training history
4. User can switch between metric types

## Performance Considerations

### Backend
- **Parsing Overhead**: Regex parsing is fast; minimal impact on log capture
- **Database Updates**: Batch writes to avoid excessive UPDATE queries
- **JSON Field Size**: Limit to ~1000 points per metric type (sample if needed)
- **API Response Size**: Typical response <100KB for full training run

### Frontend
- **Recharts Performance**: Handles 1000+ points smoothly
- **Re-render Optimization**: Use React.memo on chart component
- **Polling Impact**: 3-second interval is reasonable for real-time feel
- **Memory**: Chart unmounts when tab switches, preventing leaks

## Error Handling

### Backend
- **Parse Failures**: Log warning, continue capturing raw logs
- **Malformed Logs**: Skip unparseable lines gracefully
- **Database Errors**: Queue metrics in memory, retry on next batch

### Frontend
- **API Errors**: Show "Metrics unavailable" message
- **No Data**: Display "Training metrics will appear here" placeholder
- **Partial Data**: Render available points, show warning for gaps

## Testing Strategy

### Backend Tests
- Unit tests for metric parsing patterns
- Integration tests for log capture with metric extraction
- Verify metrics are correctly stored in database
- Test batch update logic

### Frontend Tests
- Component tests for chart rendering
- Test with mock data (empty, partial, complete)
- Verify polling behavior
- Test multi-run overlay

### E2E Tests
- Start training run, verify metrics appear in UI
- Check real-time updates during training
- Verify chart remains after training completes
- Test run comparison with multiple curves

## Migration Considerations

- **Existing Runs**: No metrics available (metrics field is null/empty)
- **UI Fallback**: Show "No metrics recorded" for old runs
- **Backward Compatibility**: New fields are additive, no breaking changes
- **Gradual Rollout**: New runs automatically get metrics, old runs unaffected

## Future Enhancements (Out of Scope)

1. **Metric Export**: Download metrics as CSV/JSON
2. **Advanced Filtering**: Date range, custom step ranges
3. **Smoothing**: Moving average overlay for noisy metrics
4. **Annotations**: Mark specific points (checkpoint saves, early stopping)
5. **Multiple Metrics**: Side-by-side charts for loss + lr simultaneously
6. **Statistical Summary**: Min/max/mean displayed alongside chart
