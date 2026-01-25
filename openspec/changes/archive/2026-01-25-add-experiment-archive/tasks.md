# Tasks: Add Experiment Archive and Dataset Soft Delete

## Implementation Checklist

### Phase 1: Backend Model Changes
- [x] Add `ARCHIVED` value to `ExperimentStatus` enum in `app/models/experiment.py`
- [x] Add `deleted_at` column to `Dataset` model in `app/models/dataset.py`
- [x] Create Alembic migration for `deleted_at` column on datasets table

### Phase 2: Backend Experiment API Changes
- [x] Add `POST /experiments/{id}/archive` endpoint to set status to ARCHIVED
- [x] Add `POST /experiments/{id}/unarchive` endpoint to restore status to DRAFT
- [x] Update `list_experiments` to exclude ARCHIVED by default
- [x] Add `include_archived` query parameter to list endpoint

### Phase 3: Backend Dataset API Changes
- [x] Add `DELETE /datasets/{id}` endpoint with reference check logic
- [x] Check no active Adapters reference the dataset (`deleted_at IS NULL`)
- [x] Check no active Experiments reference the dataset (`status != ARCHIVED`)
- [x] Return 400 with clear message if references exist
- [x] Update `list_datasets` to exclude soft-deleted by default
- [x] Add `include_deleted` query parameter to list endpoint

### Phase 4: Frontend Experiment Changes
- [x] Add archive button to experiment card (three-dot menu or icon button)
- [x] Add confirmation dialog before archive
- [x] Add "Show archived" toggle/filter to experiments list page
- [x] Add unarchive button for archived experiments
- [x] Handle archive/unarchive API responses

### Phase 5: Frontend Dataset Changes
- [x] Add delete button to dataset card
- [x] Add confirmation dialog before delete
- [x] Handle 400 error with reference message
- [x] Add "Show deleted" toggle/filter to datasets list page
- [x] Handle delete API responses

### Phase 6: Testing
- [x] Existing backend tests pass (178 tests)
- [x] Existing frontend tests pass (480 tests)
- Note: Project tests services only, not routers. Archive/delete logic is in routers.

### Phase 7: Validation
- [x] Verify all existing tests pass
