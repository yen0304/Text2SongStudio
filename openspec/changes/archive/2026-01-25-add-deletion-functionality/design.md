## Context

The system currently lacks comprehensive deletion functionality:
- Jobs can only be cancelled, not deleted
- Adapters have hard-delete which fails when jobs reference them
- Feedback has no delete endpoint

Users need to manage data lifecycle including cleanup of obsolete/test data.

## Goals / Non-Goals

### Goals
- Enable users to delete jobs with proper cascade handling
- Enable users to delete adapters without breaking job references
- Enable users to delete individual feedback records
- Provide clear UI with confirmation for destructive actions
- Maintain data integrity across related entities

### Non-Goals
- Bulk deletion operations (can be added later)
- Automatic cleanup/retention policies
- Undo/restore functionality for deleted items
- Audio file cleanup (storage management is separate concern)

## Decisions

### Decision 1: Soft-Delete for Jobs and Adapters

**What**: Use soft-delete (set `deleted_at` timestamp) for jobs and adapters instead of hard-delete.

**Why**:
- Jobs have foreign key relationships with audio samples and indirect relationships with feedback
- Adapters are referenced by multiple jobs; hard-delete would either fail or orphan jobs
- Soft-delete allows queries to filter out deleted items while preserving referential integrity
- Enables potential future restore/audit functionality

**Implementation**:
- Add `deleted_at: DateTime | null` column to `generation_jobs` and `adapters` tables
- Update all list/get queries to filter `WHERE deleted_at IS NULL` by default
- Provide optional `include_deleted=true` parameter for admin queries

### Decision 2: Hard-Delete for Feedback

**What**: Use hard-delete (actual row removal) for feedback records.

**Why**:
- Feedback records are leaf nodes with no dependent entities
- No foreign keys reference the feedback table
- Users expect immediate removal when deleting feedback
- Simplifies implementation without soft-delete overhead

### Decision 3: Cascade Feedback on Job Delete

**What**: When soft-deleting a job, hard-delete all feedback for that job's audio samples.

**Why**:
- Feedback is tied to a specific job's audio samples
- Orphaned feedback for "deleted" jobs has no meaningful context
- Prevents data inconsistency where feedback exists for deleted job
- Users expect job deletion to clean up related feedback

**Implementation**:
- In job delete endpoint, query feedback by `audio_id IN job.audio_ids`
- Delete all matching feedback records before soft-deleting job
- This is atomic within a transaction

### Decision 4: No Cascade on Adapter Delete

**What**: Soft-deleting an adapter does NOT cascade to jobs or audio samples.

**Why**:
- Historical jobs using the adapter have valid data worth preserving
- Audio samples generated with the adapter are still valid artifacts
- Adapter deletion means "don't use for new generations" not "erase history"

**Implementation**:
- Set `deleted_at` on adapter
- Jobs page shows "Deleted Adapter" for jobs referencing soft-deleted adapters
- Generation endpoint rejects requests for soft-deleted adapters

## Risks / Trade-offs

### Risk: Soft-deleted data accumulates
- **Mitigation**: Add periodic cleanup job (future) or admin bulk-purge endpoint
- **Trade-off**: Storage cost vs. data integrity and audit capability

### Risk: User confusion about soft vs hard delete
- **Mitigation**: UI always says "Delete" - soft-delete is implementation detail
- **Trade-off**: Simplicity vs. giving users explicit control

### Risk: Performance impact of `deleted_at` filter
- **Mitigation**: Add index on `deleted_at` column; filter is simple NULL check
- **Trade-off**: Minor index overhead vs. query performance

## Migration Plan

1. Create migration adding `deleted_at` columns
2. Deploy backend with new endpoints (backwards compatible)
3. Deploy frontend with delete UI
4. Existing data unaffected (all `deleted_at` values are NULL)

**Rollback**: Drop `deleted_at` columns (data loss of deletion timestamps only, no functional loss)

## Open Questions

None - design is straightforward for this scope.
