# Change: Add Prompt Templates, History Search, and Favorites

## Why
Users frequently create prompts with similar attributes for music generation. Currently, they must manually re-enter prompt text and attributes each time. This leads to repetitive work and inconsistent prompt quality. Users also cannot easily find past prompts or save high-quality ones for reuse.

## What Changes
- **Prompt Templates**: System-provided and user-created reusable prompt presets (style, mood, instruments, etc.)
- **History Search**: Full-text and attribute-based search across prompt history
- **Favorites**: Ability to bookmark prompts and audio samples for quick access

## Impact
- Affected specs:
  - `prompt-management` (ADDED: templates, favorites, search)
  - `audio-generation` (ADDED: favorite audio samples)
- Affected code:
  - Backend: New models (`PromptTemplate`, `Favorite`), new routers, new schemas
  - Frontend: PromptEditor enhancements, new Favorites page, search UI
  - Database: New tables via Alembic migration

## Scope
- **In Scope**: Templates CRUD, favorites CRUD, search by text/attributes
- **Out of Scope**: AI-suggested templates, collaborative template sharing between users
