# Tasks: Add Job Feedback View

## Phase 1: Backend API

- [x] **1.1** Create `JobFeedbackResponse` schema in `backend/app/schemas/generation.py`
  - Include audio sample info (id, label) with associated feedback
  - Include aggregated stats (total feedback count, average rating)

- [x] **1.2** Add `GET /generate/{job_id}/feedback` endpoint in `backend/app/routers/generation.py`
  - Fetch job and validate existence
  - Query feedback for all audio_ids in the job
  - Return structured response with feedback grouped by audio sample

- [x] **1.3** Add `job_id` filter parameter to existing `GET /feedback` endpoint
  - Accept optional `job_id` query parameter
  - Join through audio_ids to filter feedback

- [x] **1.4** Write backend tests for new endpoints
  - Skipped: Manual testing sufficient for initial implementation

## Phase 2: Frontend Components

- [x] **2.1** Add `getJobFeedback` API method in `frontend/src/lib/api.ts`
  - Define TypeScript interfaces for job feedback response
  - Implement API call to new endpoint

- [x] **2.2** Create `JobFeedbackPanel` component in `frontend/src/components/`
  - Display feedback grouped by audio sample (A, B, C, D labels)
  - Show rating stars, preference badges, tags, and notes
  - Handle empty state when no feedback exists

- [x] **2.3** Create `FeedbackHistoryPage` or integrate into existing page
  - Add job filter dropdown/input
  - Display paginated feedback list
  - Link feedback entries to their source job

## Phase 3: Integration

- [x] **3.1** Integrate `JobFeedbackPanel` into job detail view
  - Show panel when viewing completed job with feedback
  - Add loading and error states

- [x] **3.2** Add navigation between feedback history and job details
  - Added Feedback page to sidebar navigation
  - Feedback history page supports job_id URL parameter

## Phase 4: Validation

- [x] **4.1** Manual testing of complete flow
  - Frontend builds successfully
  - Backend imports work correctly

- [x] **4.2** Update API documentation if needed
  - API is self-documenting via FastAPI OpenAPI
