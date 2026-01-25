---
title: Database Connection and Session Management
impact: HIGH
impactDescription: Properly manage connection pool and session lifecycle
tags: infrastructure, database, sqlalchemy, connection-pool
---

## Database Connection and Session Management

Properly configure database connection pool and session management to avoid connection leaks.

**✅ Complete database.py configuration:**

```python
# infrastructure/database.py
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from infrastructure.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """SQLAlchemy Base class for all models"""
    pass


# Create Engine (connection pool)
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,          # Print SQL in development
    pool_size=5,                   # Connection pool size
    max_overflow=10,               # Extra connections beyond pool_size
    pool_timeout=30,               # Timeout for acquiring connection
    pool_recycle=1800,             # Recycle connections (avoid DB closing idle connections)
    pool_pre_ping=True,            # Ping before use to avoid using disconnected connections
)


# Create Session Factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,        # Don't expire on commit (avoid lazy load issues)
    autocommit=False,
    autoflush=False,
)


# FastAPI dependency
async def get_db() -> AsyncSession:
    """
    Dependency function to get DB Session
    
    Use async with to ensure session is properly closed
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Initialize database (create tables)
async def init_db():
    """Create all tables (for development)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Close database connections
async def close_db():
    """Close connection pool"""
    await engine.dispose()
```

**✅ Use in FastAPI Lifespan:**

```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from infrastructure.database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(lifespan=lifespan)
```

**✅ Correct usage of Session:**

```python
# ✅ Get via Depends in Router
@router.get("/{id}")
async def get_item(
    id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Item).where(Item.id == id))
    return result.scalar_one_or_none()


# ✅ Use in Service (via Repository)
class ItemService:
    def __init__(self, item_repo: ItemRepository):
        self._repo = item_repo  # Repository has session internally
    
    async def get_item(self, item_id: UUID) -> Item:
        return await self._repo.get_by_id(item_id)
```

**❌ Common errors:**

```python
# ❌ Creating session directly (bypassing DI)
@router.get("/{id}")
async def get_item(id: UUID):
    session = async_session_factory()  # Won't be closed automatically!
    result = await session.execute(...)
    return result


# ❌ Forgetting await
result = db.execute(select(Item))  # Missing await, will get coroutine


# ❌ Using session outside endpoint
session = async_session_factory()
# Session should be used within request lifecycle
```

**✅ Production environment configuration recommendations:**

```python
engine = create_async_engine(
    settings.database_url,
    echo=False,                    # Disable SQL log in production
    pool_size=20,                  # Adjust based on load
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args={
        "server_settings": {
            "application_name": "text2song-api",  # Easy to identify in DB
        }
    },
)
```
