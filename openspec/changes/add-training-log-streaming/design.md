# Design: Training Log Streaming

## Context

Users need visibility into training progress. The system runs training as a subprocess, and we need to capture its output and stream it to the frontend in real-time while also persisting it for later viewing.

### Constraints
- Training runs as a separate Python subprocess
- Must not block the main API server
- Must support page navigation (leave and return)
- Must preserve raw terminal output including `\r` and ANSI codes

## Goals / Non-Goals

### Goals
- Real-time log streaming to frontend
- Persist logs for historical viewing
- Support terminal features (progress bars, colors)
- Non-blocking architecture

### Non-Goals
- Log searching or filtering (future feature)
- Log rotation or cleanup (future feature)
- Multiple simultaneous training runs (current system is single-run)

## Decisions

### Decision 1: Raw bytes storage

Store raw terminal output as `LargeBinary` instead of parsed/structured logs.

**Rationale**: 
- Preserves `\r`, `\n`, ANSI codes exactly
- Simpler implementation
- Frontend xterm.js can render it directly

**Alternatives considered**:
- Structured JSON logs: Loses terminal formatting, requires complex parsing
- Line-by-line storage: Doesn't handle `\r` overwrites well

### Decision 2: SSE over WebSocket

Use Server-Sent Events for streaming instead of WebSocket.

**Rationale**:
- Unidirectional (server → client) is sufficient
- Native browser support via EventSource
- Simpler implementation in FastAPI
- Automatic reconnection built-in

**Alternatives considered**:
- WebSocket: More complex, bidirectional not needed
- Polling: High latency, inefficient

### Decision 3: Database Polling for simplicity

Use database polling instead of Redis Pub/Sub.

**Rationale**:
- Zero additional dependencies (no Redis needed)
- Most stable and easiest to debug
- 200ms polling interval is sufficient for log viewing
- Data is always in DB, survives restarts

**Alternatives considered**:
- Redis Pub/Sub: Lower latency but adds dependency
- PostgreSQL LISTEN/NOTIFY: More complex, marginal benefit
- In-memory queue: Single process limitation

### Decision 4: xterm.js for frontend

Use xterm.js terminal emulator instead of custom rendering.

**Rationale**:
- Full terminal emulation (handles `\r`, ANSI codes)
- Battle-tested (used by VS Code)
- Looks like real terminal

**Alternatives considered**:
- Custom `<pre>` rendering: Doesn't handle `\r` or ANSI
- react-terminal-ui: Less mature, fewer features

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Training Subprocess                         │
│  python -m model.training.cli train --config ...                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ stdout/stderr (pipe)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LogCaptureService                            │
│  - Read chunks from subprocess pipe                             │
│  - Append to PostgreSQL (training_logs.data)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                │
│                   training_logs table                           │
│                   (persistent storage)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ poll every 200ms
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI SSE Endpoint                       │
│  GET /runs/{run_id}/logs/stream                                 │
│  - Poll database for new data                                   │
│  - Yield new chunks as SSE events                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SSE (event: log, data: base64)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TrainingLogViewer Component                              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  xterm.js Terminal                                  │  │  │
│  │  │  - term.write(chunk) for each SSE event             │  │  │
│  │  │  - Supports \r, \n, ANSI colors                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

```python
class TrainingLog(Base):
    __tablename__ = "training_logs"
    
    run_id = Column(UUID, ForeignKey("experiment_runs.id"), primary_key=True)
    data = Column(LargeBinary, default=b'', nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## API Specification

### GET /runs/{run_id}/logs

Returns complete log history.

**Response** (JSON):
```json
{
  "run_id": "uuid",
  "data": "<base64 encoded bytes>",
  "size": 12345,
  "updated_at": "2026-01-26T12:00:00Z"
}
```

### GET /runs/{run_id}/logs/stream

SSE endpoint for real-time streaming.

**Event types**:
```
event: log
data: {"chunk": "<base64>"}

event: heartbeat
data: {}

event: done
data: {"exit_code": 0, "final_size": 12345}
```

## Frontend Component API

```tsx
interface TrainingLogViewerProps {
  runId: string;
  isLive?: boolean;  // Show live indicator
  height?: string;   // Terminal height (default: 400px)
}

<TrainingLogViewer runId="uuid" isLive={run.status === 'running'} />
```

## Reconnection Flow

```
1. User opens run detail page
   ├─ GET /runs/{id}/logs → Load history
   └─ SSE /runs/{id}/logs/stream → Connect live

2. User navigates away
   └─ SSE connection closes (browser handles)

3. User returns to page
   ├─ GET /runs/{id}/logs → Load full history (including new data)
   └─ SSE /runs/{id}/logs/stream → Reconnect live
   
Result: Seamless experience, no data loss
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large logs consume memory | Chunked streaming, consider log rotation later |
| 200ms polling latency | Acceptable for log viewing use case |
| Many concurrent viewers | Each polls DB independently (acceptable at small scale) |
| Long-running SSE connections | Heartbeat events to keep alive |
| Database load from polling | Use efficient offset-based queries |

## Open Questions

- [ ] Maximum log size before rotation/truncation?
- [ ] Should we compress stored logs?
- [ ] Add log download button?
