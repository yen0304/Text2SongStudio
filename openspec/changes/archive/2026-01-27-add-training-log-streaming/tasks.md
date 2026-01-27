# Tasks: Add Training Log Streaming

## 1. Backend - Database & Models

- [x] 1.1 Create `TrainingLog` model with `run_id`, `data` (LargeBinary), `updated_at`
- [x] 1.2 Create Alembic migration for `training_logs` table
- [x] 1.3 Create Pydantic schemas for log responses

## 2. Backend - Log Capture Service

- [x] 2.1 Create `LogCaptureService` to capture subprocess stdout/stderr
- [x] 2.2 Implement chunked write to database (append raw bytes)
- [x] 2.3 Update training execution to use log capture

## 3. Backend - API Endpoints

- [x] 3.1 Add `GET /runs/{run_id}/logs` endpoint (return full history)
- [x] 3.2 Add `GET /runs/{run_id}/logs/stream` SSE endpoint
- [x] 3.3 Implement SSE generator with database polling (200ms interval)
- [x] 3.4 Handle SSE connection cleanup on client disconnect
- [x] 3.5 Add endpoint to experiments router or create new logs router

## 4. Frontend - Dependencies & Setup

- [x] 4.1 Install `xterm` and `@xterm/addon-fit` packages
- [x] 4.2 Configure xterm CSS imports

## 5. Frontend - TrainingLogViewer Component

- [x] 5.1 Create `TrainingLogViewer` component with xterm.js terminal
- [x] 5.2 Implement history loading on mount (`GET /runs/{id}/logs`)
- [x] 5.3 Implement SSE connection for live streaming
- [x] 5.4 Handle SSE reconnection on component remount
- [x] 5.5 Add auto-scroll toggle
- [x] 5.6 Add terminal theme (dark mode compatible)

## 6. Frontend - Integration

- [x] 6.1 Add `TrainingLogViewer` to run detail page/modal
- [x] 6.2 Show "Live" indicator when run is in progress
- [x] 6.3 Show "Completed" indicator when run is finished
- [x] 6.4 Handle loading and error states

## 7. Testing

- [x] 7.1 Backend: Test log capture service
- [x] 7.2 Backend: Test SSE endpoint with mock data
- [x] 7.3 Backend: Test history endpoint
- [x] 7.4 Frontend: Test TrainingLogViewer component
- [x] 7.5 Integration: Test full flow with actual training

## 8. Documentation

- [x] 8.1 Update API documentation
- [x] 8.2 Add usage notes to README if needed
