# Add Adapter Rename Functionality

## Summary
Add adapter rename functionality so users can better identify adapters when selecting them.

## Problem Statement
Currently, adapters cannot be renamed after creation. When there are multiple adapters in the system, users have difficulty quickly identifying the adapter they need, especially when:
- Selecting an adapter during generation
- Configuring adapters for experiments
- Browsing the adapter list page

## Proposed Solution
Implement adapter rename functionality in the frontend:
1. **Adapter Detail Page**: Add inline edit functionality - users can click on the name to edit
2. **Adapter List Page**: Add a rename button on each adapter card

The backend API already supports `PATCH /adapters/{adapter_id}` to update the `name` field - no backend changes required.

## Scope
- **In Scope**:
  - Frontend adapter detail page inline edit name functionality
  - Frontend adapter list page rename button and dialog
  - Name validation (non-empty, 1-100 character limit)
- **Out of Scope**:
  - Backend API changes (already supported)
  - Batch rename
  - Name history tracking

## Impact Analysis
- **Backend**: No changes required - `PATCH /adapters/{adapter_id}` already supports `name` field
- **Frontend**: Need to modify `adapters/page.tsx` and `adapters/[id]/page.tsx`
- **Database**: No changes required - `adapters` table already has `name` column
- **Breaking Changes**: None

## Success Criteria
- [x] Users can edit adapter name directly on the detail page
- [x] Users can rename adapters via dialog on the list page
- [x] Name updates are immediately reflected in the UI
- [x] Empty or too-long names show validation errors
