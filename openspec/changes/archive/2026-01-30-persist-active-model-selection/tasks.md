## 1. Database Schema
- [x] 1.1 Create `SystemSetting` model with key-value storage
- [x] 1.2 Create Alembic migration for `system_settings` table
- [x] 1.3 Add model to `__init__.py` exports

## 2. Service Integration
- [x] 2.1 Add helper functions to read/write settings from DB
- [x] 2.2 Update `GenerationService.switch_model_with_progress` to persist selection
- [x] 2.3 Update `GenerationService.load_model` to read persisted selection on startup

## 3. Testing
- [x] 3.1 Verify model persists across backend restart
