# Proposal: Add Experiment Archive and Dataset Soft Delete

## Summary

Add the ability to archive experiments and soft delete datasets, allowing users to clean up unused resources while preserving audit trails and maintaining data integrity.

## Problem Statement

### Experiment
Users currently cannot remove experiments from their list view. The spec mentions "soft delete" for experiments, but:

1. **Experiments have valuable run history** - hard delete would lose metrics and training records
2. **Experiments already have a status enum** - `DRAFT`, `RUNNING`, `COMPLETED`, `FAILED`
3. **Soft delete adds complexity** - requires `deleted_at` filters in every query

A simpler solution is to add an `ARCHIVED` status.

### Dataset
Users cannot delete unused datasets. When a training fails and the adapter is deleted, the dataset remains orphaned. However:

1. **Adapters use soft delete** - `deleted_at` column exists
2. **Datasets may be referenced** - by Adapters and Experiments
3. **Consistency required** - if adapter is restored, dataset should still exist

Solution: Soft delete for datasets, but only when no active references exist.

## Proposed Solution

### Experiment
1. Add `ARCHIVED` to `ExperimentStatus` enum
2. Add archive/unarchive API endpoints
3. Exclude archived experiments from default list (allow filter to include)
4. Add archive button to frontend UI

### Dataset
1. Add `deleted_at` column via migration
2. Add delete endpoint with reference check
3. Only allow delete when all referencing Adapters are soft-deleted AND all Experiments are archived
4. Exclude soft-deleted datasets from default list
5. Add delete button to frontend UI

## Impact Assessment

| Area | Impact |
|------|--------|
| Database Schema | New `deleted_at` column on datasets table |
| API | Experiment: archive/unarchive endpoints; Dataset: delete endpoint |
| Frontend | Archive button for experiments; Delete button for datasets |
| Existing Data | None |

## Delete Rules

| Entity | Delete Condition |
|--------|------------------|
| **Adapter** | Can soft delete independently |
| **Dataset** | Only when ALL referencing Adapters are soft-deleted AND ALL Experiments are archived |
| **Experiment** | Can archive independently |

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Archive status for Experiment** | Simple, reversible, uses existing infra | Adds one enum value |
| **Soft delete for Dataset** | Consistent with Adapter, supports restore | Requires migration |
| Hard delete | Simple | Loses data, breaks audit trail |

## Success Criteria

- [ ] Archived experiments hidden from default list
- [ ] Filter option to show archived experiments
- [ ] Archive/unarchive buttons in UI
- [ ] All run history preserved after archive
- [ ] Dataset soft delete only succeeds when no active references
- [ ] Soft-deleted datasets hidden from default list
- [ ] Delete button for datasets in UI
- [ ] All tests pass
