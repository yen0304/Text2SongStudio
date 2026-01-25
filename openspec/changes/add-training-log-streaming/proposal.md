# Proposal: Add Training Log Streaming

## Summary

Add real-time training log streaming to the frontend, allowing users to view the raw terminal output of training runs as they happen. Users can navigate away and return to see the complete log history.

## Problem Statement

Currently, when a training run is in progress:

1. **No visibility** - Users cannot see what's happening during training
2. **No debugging info** - If training fails, users can't see the error context
3. **No progress feedback** - Users don't know if training is progressing or stuck

Users expect to see the same terminal output they would see if running training locally, including:
- tqdm progress bars with `\r` carriage returns
- ANSI color codes
- Real-time loss and learning rate updates
- Error messages and stack traces

## Proposed Solution

### Backend

1. **Database**: Add `TrainingLog` model to store raw terminal output per run
2. **Log Capture**: Capture stdout/stderr from training subprocess and store as raw bytes
3. **SSE Endpoint**: `GET /runs/{id}/logs/stream` for real-time streaming (database polling)
4. **History Endpoint**: `GET /runs/{id}/logs` to retrieve full log history

### Frontend

1. **xterm.js Integration**: Terminal emulator that supports `\r`, ANSI codes
2. **TrainingLogViewer Component**: Embedded in run detail page
3. **Auto-reconnect**: SSE reconnection on page return
4. **History Replay**: Load full history then connect to live stream

### Data Flow

```
Training Process (subprocess)
    │
    │ stdout/stderr (raw bytes)
    ▼
┌─────────────────┐
│  Log Capture    │ ──► PostgreSQL (persist)
│  Service        │
└─────────────────┘
         │
         ▼
    SSE Endpoint (polls DB every 200ms)
         │
         ▼
    xterm.js (Frontend)
```

## Impact Assessment

| Area | Impact |
|------|--------|
| Database Schema | New `training_logs` table |
| Backend | New SSE endpoint, log capture service |
| Frontend | New xterm.js component, EventSource handling |
| Dependencies | Frontend: `xterm` (no new backend dependencies) |
| Training Code | Subprocess stdout/stderr capture |

## API Design

### GET /runs/{run_id}/logs
Returns full raw log history as binary/base64.

**Response**: `application/octet-stream` or JSON with base64 data

### GET /runs/{run_id}/logs/stream
SSE endpoint for real-time log streaming.

**Events**:
```
event: log
data: <base64 encoded chunk>

event: done
data: {"exit_code": 0}
```

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Raw terminal (xterm.js)** | Authentic experience, supports progress bars | Slightly larger payload |
| Structured JSON logs | Smaller payload, easier to filter | Loses terminal formatting, no progress bars |
| Polling | Simple | High latency, inefficient |

## Success Criteria

- [ ] Training logs visible in real-time during run
- [ ] Progress bars (tqdm) render correctly with `\r`
- [ ] ANSI colors displayed properly
- [ ] User can navigate away and return to see full history
- [ ] SSE reconnects automatically on page return
- [ ] Completed runs show full log history
- [ ] Log streaming does not block other API endpoints
- [ ] All tests pass
