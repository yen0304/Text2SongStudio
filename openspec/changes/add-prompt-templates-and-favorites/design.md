## Context
Users need efficient ways to create prompts without repetitive manual entry, find past work quickly, and save valuable outputs for reuse. These three features (templates, search, favorites) work together to improve the prompt-to-generation workflow.

## Goals / Non-Goals

### Goals
- Reduce time to create prompts by 50%+ through template reuse
- Enable quick discovery of past prompts via full-text and attribute search
- Allow users to bookmark valuable prompts and audio samples

### Non-Goals
- AI-powered template suggestions (future feature)
- Public template marketplace or sharing between users
- Audio content-based search (e.g., "find music similar to this")

## Decisions

### Decision 1: Template Storage Model
**Choice**: Store templates in a dedicated `prompt_templates` table with same schema as prompts plus metadata (name, description, is_system, category).

**Rationale**: Separating templates from regular prompts keeps the prompt table clean and allows system-wide templates vs user templates distinction.

**Alternatives considered**:
- Flag on prompts table (`is_template`) - Rejected: pollutes prompt queries, harder to manage system templates
- JSON file for system templates - Rejected: less flexible, harder to extend

### Decision 2: Favorites as Polymorphic Association
**Choice**: Use a single `favorites` table with `target_type` (prompt/audio) and `target_id` columns.

**Rationale**: Simple design, easy to extend to other entity types later (e.g., adapters, datasets).

**Alternatives considered**:
- Separate tables (`favorite_prompts`, `favorite_audios`) - Rejected: table proliferation
- JSON array on user record - Rejected: no user model yet, harder to query

### Decision 3: Search Implementation
**Choice**: PostgreSQL full-text search with `tsvector` for text, standard SQL for attribute filtering.

**Rationale**: No additional infrastructure needed. PostgreSQL FTS is sufficient for expected scale (<100k prompts).

**Alternatives considered**:
- Elasticsearch - Rejected: overkill for current scale, adds infrastructure
- Application-level filtering - Rejected: poor performance at scale

## Database Schema

```sql
-- Prompt Templates
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    text TEXT NOT NULL,
    attributes JSONB DEFAULT '{}',
    category VARCHAR(50),        -- e.g., 'electronic', 'classical', 'ambient'
    is_system BOOLEAN DEFAULT FALSE,
    user_id UUID,                -- NULL for system templates
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Favorites (polymorphic)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL,  -- 'prompt' or 'audio'
    target_id UUID NOT NULL,
    user_id UUID,                       -- NULL until auth implemented
    note TEXT,                          -- Optional user note
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(target_type, target_id, user_id)
);

-- Full-text search index
CREATE INDEX prompts_search_idx ON prompts USING GIN (to_tsvector('english', text));
```

## API Endpoints

### Templates
- `GET /templates` - List templates (filter by category, is_system)
- `GET /templates/{id}` - Get template details
- `POST /templates` - Create user template
- `PUT /templates/{id}` - Update user template
- `DELETE /templates/{id}` - Delete user template

### Favorites
- `GET /favorites` - List user favorites (filter by target_type)
- `POST /favorites` - Add to favorites
- `DELETE /favorites/{id}` - Remove from favorites

### Search
- `GET /prompts/search?q=...&style=...&mood=...` - Search prompts

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Full-text search performance | Add GIN index, implement pagination, cache frequent queries |
| Template sprawl | Limit user templates to 100, provide categories |
| No user model yet | Use nullable user_id, ready for auth integration |

## Migration Plan

1. Add database migration for new tables
2. Seed system templates (5-10 common music styles)
3. Deploy backend changes
4. Deploy frontend changes
5. No breaking changes to existing API

## Open Questions

- [ ] Should system templates be editable by admins via UI or only code?
  - **Proposed**: Code-only for v1, admin UI in future
- [ ] What categories for system templates?
  - **Proposed**: electronic, classical, jazz, ambient, cinematic, pop
