# Tasks: Add Training Log Streaming

## 1. Backend - Database & Models

- [ ] 1.1 Create `TrainingLog` model with `run_id`, `data` (LargeBinary), `updated_at`
- [ ] 1.2 Create Alembic migration for `training_logs` table
- [ ] 1.3 Create Pydantic schemas for log responses

## 2. Backend - Log Capture Service

- [ ] 2.1 Create `LogCaptureService` to capture subprocess stdout/stderr
- [ ] 2.2 Implement chunked write to database (append raw bytes)
- [ ] 2.3 Update training execution to use log capture

## 3. Backend - API Endpoints

- [ ] 3.1 Add `GET /runs/{run_id}/logs` endpoint (return full history)
- [ ] 3.2 Add `GET /runs/{run_id}/logs/stream` SSE endpoint
- [ ] 3.3 Implement SSE generator with database polling (200ms interval)
- [ ] 3.4 Handle SSE connection cleanup on client disconnect
- [ ] 3.5 Add endpoint to experiments router or create new logs router

## 4. Frontend - Dependencies & Setup

- [ ] 4.1 Install `xterm` and `@xterm/addon-fit` packages
- [ ] 4.2 Configure xterm CSS imports

## 5. Frontend - TrainingLogViewer Component

- [ ] 5.1 Create `TrainingLogViewer` component with xterm.js terminal
- [ ] 5.2 Implement history loading on mount (`GET /runs/{id}/logs`)
- [ ] 5.3 Implement SSE connection for live streaming
- [ ] 5.4 Handle SSE reconnection on component remount
- [ ] 5.5 Add auto-scroll toggle
- [ ] 5.6 Add terminal theme (dark mode compatible)

## 6. Frontend - Integration

- [ ] 6.1 Add `TrainingLogViewer` to run detail page/modal
- [ ] 6.2 Show "Live" indicator when run is in progress
- [ ] 6.3 Show "Completed" indicator when run is finished
- [ ] 6.4 Handle loading and error states

## 7. Testing

- [ ] 7.1 Backend: Test log capture service
- [ ] 7.2 Backend: Test SSE endpoint with mock data
- [ ] 7.3 Backend: Test history endpoint
- [ ] 7.4 Frontend: Test TrainingLogViewer component
- [ ] 7.5 Integration: Test full flow with actual training

## 8. Documentation

- [ ] 8.1 Update API documentation
- [ ] 8.2 Add usage notes to README if needed
