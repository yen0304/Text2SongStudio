---
title: All I/O Operations Must Be Async
impact: CRITICAL
impactDescription: Prevent blocking event loop, improve concurrency
tags: infrastructure, async, performance
---

## All I/O Operations Must Be Async

FastAPI is an async framework. All I/O operations (DB, HTTP, File) must use async versions.

**❌ Incorrect (Using synchronous I/O):**

```python
# Synchronous DB operation - blocks event loop!
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{id}")
async def get_item(id: UUID, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.id == id).first()  # ❌ Sync query


# Synchronous HTTP request - blocks!
import requests

@router.get("/external")
async def fetch_external():
    response = requests.get("https://api.example.com")  # ❌ Sync HTTP
    return response.json()


# Synchronous file operation - blocks!
@router.post("/upload")
async def upload(file: UploadFile):
    with open(f"uploads/{file.filename}", "wb") as f:  # ❌ Sync file
        f.write(await file.read())
```

**✅ Correct (Using Async I/O):**

```python
# Async DB operation
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://...",  # ✅ Use asyncpg driver
    echo=False,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


@router.get("/{id}", response_model=ItemResponse)
async def get_item(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.id == id))  # ✅ Async query
    return result.scalar_one_or_none()


# Async HTTP request
import httpx

@router.get("/external")
async def fetch_external():
    async with httpx.AsyncClient() as client:  # ✅ Async HTTP
        response = await client.get("https://api.example.com")
        return response.json()


# Async file operation
import aiofiles

@router.post("/upload")
async def upload(file: UploadFile):
    async with aiofiles.open(f"uploads/{file.filename}", "wb") as f:  # ✅ Async file
        content = await file.read()
        await f.write(content)
    return {"filename": file.filename}
```

**✅ Use asyncio.gather for parallel execution:**

```python
import asyncio

@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Parallel queries, not sequential waiting
    users_count, orders_count, revenue = await asyncio.gather(
        db.scalar(select(func.count(User.id))),
        db.scalar(select(func.count(Order.id))),
        db.scalar(select(func.sum(Order.total))),
    )
    return {
        "users": users_count,
        "orders": orders_count,
        "revenue": revenue,
    }
```

**If you must use sync functions, use run_in_executor:**

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

def sync_heavy_computation(data):
    # Third-party library that cannot be made async
    return some_sync_library.process(data)


@router.post("/process")
async def process_data(data: DataInput):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor,
        sync_heavy_computation,
        data.model_dump(),
    )
    return {"result": result}
```
