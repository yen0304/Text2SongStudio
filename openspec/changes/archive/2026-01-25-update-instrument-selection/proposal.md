# Change: Update Instrument Selection to Checkbox-Based UI

## Why

The current instrument selection uses a free-form text input where users type comma-separated instrument names (e.g., "piano, drums, synth"). This approach has several issues:
- Users may not know which instruments are supported by the music generation model
- Typos and inconsistent naming lead to unpredictable results
- No discoverability of available options

Switching to a checkbox-based selection provides:
- Clear visibility of all available instruments organized by category
- Consistent instrument names passed to the backend
- Better UX with collapsible categories and multi-select
- Primary/secondary instrument distinction for better prompt control
- Reduced user error

## What Changes

- **Frontend**: Replace the text input with a categorized, collapsible checkbox UI supporting primary and secondary instrument selection
- **Backend**:
  - Replace `instrumentation` field with `primary_instruments` and `secondary_instruments`
  - Add comprehensive list of 56 allowed instruments organized by category
  - Update prompt building to distinguish primary ("featuring") vs secondary ("with subtle")

No new API endpoints are added. The existing prompt creation flow remains unchanged - only the UI input method, schema fields, and prompt construction are updated.

## Impact

- Affected specs: `prompt-management`
- Affected code:
  - `frontend/src/components/PromptEditor.tsx` - Categorized checkbox UI with primary/secondary
  - `frontend/src/lib/api.ts` - Updated PromptAttributes interface
  - `backend/app/schemas/prompt.py` - New instrument lists and validators
  - `backend/app/services/generation.py` - Updated prompt construction
