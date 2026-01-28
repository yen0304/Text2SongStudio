# Proposal: Add Training Loss Visualization

## Why

Currently, users can view training logs as text output in the terminal window on the experiment detail page, but there is no way to visualize training metrics (loss, learning rate, etc.) over time. This makes it difficult to:

1. Quickly assess training progress at a glance
2. Compare training dynamics across different runs
3. Identify issues like overfitting or unstable training early
4. Make informed decisions about when to stop training

Visual representation of training metrics is essential for:
- **Faster debugging**: Spot training issues (divergence, plateaus) immediately
- **Better decision-making**: Know when to stop training or adjust hyperparameters
- **Efficient comparison**: Understand differences between runs at a glance
- **Professional UX**: Modern ML platforms provide metric visualization as standard

## What

Add real-time training loss visualization on the experiment detail page:

## Proposed Solution

Add real-time training loss visualization on the experiment detail page:

### Backend Changes
1. **Structured Metric Capture**: Parse training output to extract metrics (loss, learning rate, step/epoch) and store them in the `ExperimentRun.metrics` JSON field as time-series data
2. **Metrics Endpoint**: Add API endpoint to retrieve formatted metric data for visualization
3. **Real-time Updates**: Update metrics during training as logs are captured

### Frontend Changes  
1. **Loss Chart Component**: Display line chart beneath the terminal window showing loss over time
2. **Multiple Metrics**: Support toggling between different metrics (loss, learning rate, gradient norm)
3. **Multi-run Comparison**: When comparing runs, overlay their loss curves on the same chart
4. **Responsive Layout**: Chart adapts to available space and integrates seamlessly with existing UI

## Scope

### In Scope
- Extract and store loss, learning rate, and step number from training logs
- Display loss vs. steps chart on experiment detail page (Runs tab)
- Real-time chart updates during active training
- Basic chart interactions (zoom, pan, hover for values)
- Multi-run overlay in comparison view

### Out of Scope
- Advanced metrics (accuracy, perplexity) beyond what's already logged
- Downloadable metric exports (CSV, JSON) - can be added later
- Tensorboard integration
- Custom metric definitions
- Historical trend analysis across experiments

## User Impact

Users will be able to:
- Monitor training health visually without parsing logs
- Quickly identify optimal stopping points
- Compare training dynamics between different configurations
- Debug training issues more efficiently

## Technical Considerations

### Data Structure
Store metrics in `ExperimentRun.metrics` as:
```json
{
  "loss": [
    {"step": 1, "value": 2.34, "timestamp": "2026-01-28T..."},
    {"step": 10, "value": 2.21, "timestamp": "2026-01-28T..."}
  ],
  "learning_rate": [...],
  "grad_norm": [...]
}
```

### Parsing Strategy
- Use regex patterns to extract metrics from log lines
- Handle both supervised and DPO training formats
- Gracefully handle missing or malformed log entries

### Frontend Library
Use Recharts (already available in the codebase via shadcn) for:
- Responsive line charts
- Multiple series support
- Built-in interactions (hover, zoom)
- Consistent theming with existing UI

## Alternatives Considered

1. **Tensorboard Integration**: More powerful but adds complexity and requires separate service
2. **Push-based Metrics**: Training code directly writes to API - cleaner but requires more backend changes
3. **Client-side Log Parsing**: Parse logs in browser - simpler backend but poor performance with large logs

## Success Criteria

- [ ] Training metrics are extracted and stored in database during training
- [ ] Loss chart displays on experiment detail page beneath terminal
- [ ] Chart updates in real-time during active training (2-5 second delay acceptable)
- [ ] Multiple runs can be compared with overlaid curves
- [ ] Chart is responsive and performs well with 1000+ data points
- [ ] Existing training functionality remains unaffected

## Dependencies

- No new external dependencies required
- Leverages existing Recharts library
- Uses existing database schema (`ExperimentRun.metrics` field)

## Rollout Plan

1. Implement backend metric parsing and storage
2. Add metrics API endpoint
3. Create frontend chart component
4. Integrate chart into experiment detail page
5. Add multi-run comparison support
6. Testing and refinement
