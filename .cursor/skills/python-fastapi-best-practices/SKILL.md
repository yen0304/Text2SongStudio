---
name: python-fastapi-best-practices
description: Python FastAPI coding rules based on Clean Architecture and industry best practices. Use when writing, reviewing, or refactoring FastAPI code. Focuses on separation of concerns, dependency injection, and maintainable code structure.
license: MIT
metadata:
  author: text2song-studio
  version: "2.0.0"
---

# Python FastAPI Best Practices (Clean Architecture)

FastAPI coding rules based on Clean Architecture and industry standards. Focuses on separation of concerns, dependency injection, testability, and maintainability.

## Core Principles

1. **Dependency Rule** - Dependencies point inward only; inner layers don't know about outer layers
2. **Separation of Concerns** - Each layer has a single responsibility
3. **Dependency Injection** - Decouple layers through DI
4. **Interface Segregation** - Use Protocol/ABC to define abstract interfaces

## When to Apply

Use these rules to:
- Review existing FastAPI project architecture
- Refactor code that violates Clean Architecture
- Ensure new features follow architectural principles
- Use as a checklist during Code Review

## Rule Categories (by Clean Architecture Layer)

| Layer | Category | Description | Prefix |
|-------|----------|-------------|--------|
| 1 | Domain Layer | Core business logic, Entities | `domain-` |
| 2 | Application Layer | Use Cases, Services | `service-` |
| 3 | Interface Adapters | Routers, Schemas, Repositories | `adapter-` |
| 4 | Infrastructure | Database, External APIs, Config | `infra-` |
| 5 | Cross-Cutting | Error Handling, Logging, Testing | `cross-` |

## Quick Reference

### 1. Domain Layer (Core Business Logic)

- `domain-entities` - Define pure Python business entities, framework-independent
- `domain-value-objects` - Use Value Objects to encapsulate business rules
- `domain-no-framework` - Domain layer must not import FastAPI/SQLAlchemy

### 2. Service Layer (Application Services)

- `service-single-responsibility` - Each Service handles one Use Case only
- `service-no-http` - Service must not handle HTTP concepts (status code, headers)
- `service-repository-pattern` - Access data through Repository abstraction
- `service-transaction` - Service owns transaction boundaries
- `service-dto` - Service returns DTOs, not ORM Models

### 3. Adapter Layer (Interface Adapters)

- `adapter-thin-router` - Router only adapts, contains no business logic
- `adapter-schema-validation` - Use Pydantic Schema for input validation
- `adapter-response-model` - Always define explicit Response Schema
- `adapter-repository-impl` - Repository implementation lives in Adapter layer

### 4. Infrastructure Layer

- `infra-config` - Use pydantic-settings for configuration management
- `infra-database` - Database connection and Session management
- `infra-async-all` - All I/O operations must be async
- `infra-external-api` - Encapsulate external API calls

### 5. Cross-Cutting Concerns

- `cross-dependency-injection` - Use Depends() for dependency injection
- `cross-error-handling` - Unified error handling mechanism
- `cross-logging` - Structured logging
- `cross-testing` - Design for testability

## Recommended Project Structure (Clean Architecture)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app composition root
│   ├── dependencies.py         # Global dependency injection
│   │
│   ├── domain/                 # 🔵 Domain Layer (innermost)
│   │   ├── __init__.py
│   │   ├── entities/           # Business entities
│   │   │   └── prompt.py       # class Prompt (pure Python)
│   │   ├── value_objects/      # Value objects
│   │   │   └── audio_format.py
│   │   ├── exceptions.py       # Business exceptions
│   │   └── interfaces/         # Repository interfaces (Protocol)
│   │       └── prompt_repository.py
│   │
│   ├── services/               # 🟢 Application Layer
│   │   ├── __init__.py
│   │   ├── prompt_service.py   # Use Case implementation
│   │   └── generation_service.py
│   │
│   ├── adapters/               # 🟡 Interface Adapters
│   │   ├── __init__.py
│   │   ├── routers/            # FastAPI Routers (Controllers)
│   │   │   ├── __init__.py
│   │   │   └── prompts.py
│   │   ├── schemas/            # Pydantic Schemas (DTOs)
│   │   │   ├── __init__.py
│   │   │   └── prompt.py
│   │   └── repositories/       # Repository implementations
│   │       ├── __init__.py
│   │       └── sqlalchemy_prompt_repository.py
│   │
│   └── infrastructure/         # 🔴 Infrastructure Layer (outermost)
│       ├── __init__.py
│       ├── config.py           # Settings
│       ├── database.py         # DB Connection
│       └── models/             # SQLAlchemy ORM Models
│           ├── __init__.py
│           └── prompt.py
│
├── tests/
│   ├── unit/                   # Unit tests (Mock dependencies)
│   ├── integration/            # Integration tests (Real DB)
│   └── conftest.py
│
├── alembic/                    # DB Migrations
└── pyproject.toml
```

## Common Anti-Patterns

### ❌ Fat Router
Router contains business logic, database queries, complex calculations

### ❌ Anemic Service
Service is just pass-through with no real business logic

### ❌ ORM Leak
Returning SQLAlchemy Model directly to API, exposing internal structure

### ❌ God Service
One Service does everything, violating Single Responsibility

### ❌ Direct DB Access
Router or Service directly operates `db.execute()` without going through Repository
