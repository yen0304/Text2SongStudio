## 1. Database Schema

- [x] 1.1 Create Alembic migration adding `deleted_at` column to `generation_jobs` table
- [x] 1.2 Create Alembic migration adding `deleted_at` column to `adapters` table
- [x] 1.3 Add index on `deleted_at` columns for query performance

## 2. Backend Models

- [x] 2.1 Update `GenerationJob` model with `deleted_at` field
- [x] 2.2 Update `Adapter` model with `deleted_at` field

## 3. Backend API - Job Deletion

- [x] 3.1 Add `DELETE /jobs/{job_id}` endpoint with soft-delete and feedback cascade
- [x] 3.2 Update `GET /jobs` to exclude soft-deleted jobs by default
- [x] 3.3 Update `GET /jobs/{job_id}` to return 404 for soft-deleted jobs
- [x] 3.4 Update `GET /jobs/stats` to exclude soft-deleted jobs

## 4. Backend API - Adapter Deletion

- [x] 4.1 Modify `DELETE /adapters/{adapter_id}` to use soft-delete instead of hard-delete
- [x] 4.2 Update `GET /adapters` to exclude soft-deleted adapters by default
- [x] 4.3 Update `GET /adapters/{adapter_id}` to return 404 for soft-deleted adapters
- [x] 4.4 Update `POST /generate` to reject soft-deleted adapters
- [x] 4.5 Update jobs list to show "Deleted Adapter" indicator for soft-deleted adapter references

## 5. Backend API - Feedback Deletion

- [x] 5.1 Add `DELETE /feedback/{feedback_id}` endpoint with hard-delete
- [x] 5.2 ~~Add `DELETE /feedback/bulk` endpoint~~ (deferred to future - bulk operations are non-goal per design.md)

## 6. Frontend API Client

- [x] 6.1 Add `deleteJob(id)` method to API client
- [x] 6.2 Update `deleteAdapter(id)` method (already exists, ensure correct behavior)
- [x] 6.3 Add `deleteFeedback(id)` method to API client

## 7. Frontend UI - Jobs

- [x] 7.1 Add delete button to jobs list with confirmation dialog
- [x] 7.2 Add delete button to job detail page with cascade warning
- [x] 7.3 Handle delete success with list refresh and navigation

## 8. Frontend UI - Adapters

- [x] 8.1 Add delete button to adapters list with confirmation dialog
- [x] 8.2 Add delete button to adapter detail page
- [x] 8.3 Show warning that jobs using this adapter will show "Deleted Adapter"

## 9. Frontend UI - Feedback

- [x] 9.1 Add delete button to individual feedback items in FeedbackPanel
- [x] 9.2 Add delete button to FeedbackHistory component (JobFeedbackPanel)
- [x] 9.3 Add confirmation dialog for feedback deletion

## 10. Testing

- [x] 10.1 Add backend tests for job deletion endpoint and cascade behavior
- [x] 10.2 Add backend tests for adapter soft-delete
- [x] 10.3 Add backend tests for feedback deletion
- [x] 10.4 Add frontend tests for delete confirmation dialogs
- [x] 10.5 Add frontend tests for API client delete methods
