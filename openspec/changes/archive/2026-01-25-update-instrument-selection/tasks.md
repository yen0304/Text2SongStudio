# Tasks

## 1. Backend Changes
- [x] 1.1 Define `ALLOWED_INSTRUMENTS` constant with 56 instruments in `backend/app/schemas/prompt.py`
- [x] 1.2 Replace `instrumentation` field with `primary_instruments` and `secondary_instruments`
- [x] 1.3 Add field validators for both instrument fields
- [x] 1.4 Update `generation.py` prompt building to use "featuring" for primary and "with subtle" for secondary

## 2. Frontend Changes
- [x] 2.1 Add `INSTRUMENT_CATEGORIES` constant with 7 categories in `PromptEditor.tsx`
- [x] 2.2 Add state for `primaryInstruments`, `secondaryInstruments`, and `expandedCategories`
- [x] 2.3 Implement collapsible category UI with expand/collapse toggle
- [x] 2.4 Implement primary (P) and secondary (S) checkbox columns per instrument
- [x] 2.5 Update `handleGenerate` to pass `primary_instruments` and `secondary_instruments`
- [x] 2.6 Update `api.ts` PromptAttributes interface
