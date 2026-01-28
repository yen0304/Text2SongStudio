# Implementation Tasks

## Prerequisites
- [x] Confirm backend `PATCH /adapters/{adapter_id}` supports `name` field update (confirmed)

## Frontend Tasks

### 1. Adapter Detail Page - Inline Edit Name
- [x] Implement inline edit in `adapters/[id]/page.tsx` PageHeader area
- [x] Add editing state management (editing, saving)
- [x] Click on name or edit icon to enter edit mode
- [x] Press Enter or click confirm button to save
- [x] Press Escape or click cancel button to discard changes
- [x] Call `adaptersApi.update(adapterId, { name: newName })` to save
- [x] Update local state after successful save
- [x] Add name validation (1-100 characters)

### 2. Adapter List Page - Rename Button and Dialog
- [x] Add rename button (Pencil icon) to each adapter row in `adapters/page.tsx`
- [x] Implement rename dialog component
- [x] Dialog includes: current name, input field, cancel/save buttons
- [x] Call `adaptersApi.update(adapterId, { name: newName })` to save
- [x] Refresh list and close dialog after successful save
- [x] Add name validation (1-100 characters)

## Testing
- [x] Test detail page inline edit functionality
- [x] Test list page rename dialog functionality
- [x] Test empty name validation
- [x] Test name length validation
- [x] Test cancel edit does not change name

## Documentation
- [x] Update CHANGELOG.md
