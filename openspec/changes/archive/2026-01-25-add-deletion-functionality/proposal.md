# Change: Add Deletion Functionality for Jobs, Adapters, and Feedback

## Why

Users need the ability to delete generation jobs, adapters, and feedback records to:
- Remove obsolete or failed experiments
- Clean up test data during development
- Manage storage by removing unwanted audio samples
- Correct data entry mistakes in feedback

## What Changes

### Backend API

- **Job Deletion**: Add soft-delete for generation jobs with cascading cleanup of associated audio samples and feedback
- **Adapter Deletion**: Change from hard-delete to soft-delete (adapters are linked to jobs via `adapter_id` foreign key)
- **Feedback Deletion**: Add endpoint to delete individual feedback records

### Frontend UI

- **Jobs Page**: Add delete action with confirmation dialog
- **Job Detail Page**: Add delete button with cascade warning
- **Adapters Page**: Add delete action with warning about associated jobs
- **Adapter Detail Page**: Add delete button
- **Feedback Panel**: Add delete action for individual feedback items

### Database Schema

- Add `deleted_at` column to `generation_jobs` table for soft-delete
- Add `deleted_at` column to `adapters` table for soft-delete (replacing hard-delete)
- Keep hard-delete for feedback (individual records, no dependencies)

### Cascade Behavior

1. **Deleting a Job**:
   - Soft-deletes the job (sets `deleted_at`)
   - Hard-deletes all associated feedback records (via `audio_ids`)
   - Audio samples remain for potential future reference (but can be cleaned up separately)

2. **Deleting an Adapter**:
   - Soft-deletes the adapter (sets `deleted_at`)
   - Jobs using this adapter remain but show "Deleted Adapter" indicator
   - Future generations cannot use soft-deleted adapters

3. **Deleting Feedback**:
   - Hard-deletes the individual feedback record
   - No cascade effects

## Impact

- Affected specs: `audio-generation`, `lora-adapter-management`, `feedback-collection`
- Affected code:
  - Backend: `backend/app/models/job.py`, `backend/app/models/adapter.py`, `backend/app/routers/generation.py`, `backend/app/routers/adapters.py`, `backend/app/routers/feedback.py`, `backend/app/routers/jobs.py`
  - Frontend: `frontend/src/lib/api.ts`, `frontend/src/app/jobs/page.tsx`, `frontend/src/app/jobs/[id]/page.tsx`, `frontend/src/app/adapters/page.tsx`, `frontend/src/app/adapters/[id]/page.tsx`, `frontend/src/components/FeedbackPanel.tsx`
  - Database: New migration for `deleted_at` columns
