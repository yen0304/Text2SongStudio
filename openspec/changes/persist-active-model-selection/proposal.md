# Change: Persist Active Model Selection

## Why
Currently, the active model selection is stored only in memory (`GenerationService._current_model_name`). When the backend restarts, it defaults back to `musicgen-small` regardless of user preference. This is inconvenient for users who prefer larger models like `musicgen-medium`.

## What Changes
- Add a new `SystemSetting` database table to store key-value configuration
- Store and retrieve `active_model_id` from database on startup/switch
- Backend loads last-used model on startup

## Impact
- Affected specs: None (new internal capability, no user-facing API changes)
- Affected code:
  - `backend/app/models/` - New `system_setting.py` model
  - `backend/app/services/generation.py` - Read/write active model to DB
  - `backend/alembic/versions/` - New migration
