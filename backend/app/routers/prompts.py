from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prompt
from app.schemas import (
    PromptCreate,
    PromptListResponse,
    PromptResponse,
    PromptSearchResponse,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post("", response_model=PromptResponse, status_code=201)
async def create_prompt(
    data: PromptCreate,
    db: AsyncSession = Depends(get_db),
):
    prompt = Prompt(
        text=data.text,
        attributes=data.attributes.model_dump() if data.attributes else {},
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)

    return PromptResponse(
        id=prompt.id,
        text=prompt.text,
        attributes=prompt.attributes,
        created_at=prompt.created_at,
        audio_sample_ids=[s.id for s in prompt.audio_samples],
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return PromptResponse(
        id=prompt.id,
        text=prompt.text,
        attributes=prompt.attributes,
        created_at=prompt.created_at,
        audio_sample_ids=[s.id for s in prompt.audio_samples],
    )


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit

    # Get total count
    count_result = await db.execute(select(func.count(Prompt.id)))
    total = count_result.scalar()

    # Get prompts
    result = await db.execute(
        select(Prompt).order_by(Prompt.created_at.desc()).offset(offset).limit(limit)
    )
    prompts = result.scalars().all()

    return PromptListResponse(
        items=[
            PromptResponse(
                id=p.id,
                text=p.text,
                attributes=p.attributes,
                created_at=p.created_at,
                audio_sample_ids=[s.id for s in p.audio_samples],
            )
            for p in prompts
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/search", response_model=PromptSearchResponse)
async def search_prompts(
    q: str | None = Query(None, description="Full-text search query"),
    style: str | None = Query(None, description="Filter by style attribute"),
    mood: str | None = Query(None, description="Filter by mood attribute"),
    tempo_min: int | None = Query(
        None, ge=40, le=200, description="Minimum tempo (BPM)"
    ),
    tempo_max: int | None = Query(
        None, ge=40, le=200, description="Maximum tempo (BPM)"
    ),
    date_from: datetime | None = Query(
        None, description="Filter prompts created after this date"
    ),
    date_to: datetime | None = Query(
        None, description="Filter prompts created before this date"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search prompts with full-text search and attribute filters.

    - **q**: Full-text search on prompt text (uses PostgreSQL FTS)
    - **style**: Filter by style attribute (exact match)
    - **mood**: Filter by mood attribute (exact match)
    - **tempo_min/tempo_max**: Filter by tempo range
    - **date_from/date_to**: Filter by creation date range
    """
    offset = (page - 1) * limit
    conditions = []

    # Full-text search on prompt text
    if q:
        # Use PostgreSQL full-text search with plainto_tsquery for simple queries
        conditions.append(
            text(
                "to_tsvector('english', text) @@ plainto_tsquery('english', :query)"
            ).bindparams(query=q)
        )

    # Style filter (JSON attribute)
    if style:
        conditions.append(text("attributes->>'style' = :style").bindparams(style=style))

    # Mood filter (JSON attribute)
    if mood:
        conditions.append(text("attributes->>'mood' = :mood").bindparams(mood=mood))

    # Tempo range filter (JSON attribute)
    if tempo_min is not None:
        conditions.append(
            text("(attributes->>'tempo')::int >= :tempo_min").bindparams(
                tempo_min=tempo_min
            )
        )
    if tempo_max is not None:
        conditions.append(
            text("(attributes->>'tempo')::int <= :tempo_max").bindparams(
                tempo_max=tempo_max
            )
        )

    # Date range filter
    if date_from is not None:
        conditions.append(Prompt.created_at >= date_from)
    if date_to is not None:
        conditions.append(Prompt.created_at <= date_to)

    # Build queries
    base_query = select(Prompt)
    count_query = select(func.count(Prompt.id))

    if conditions:
        base_query = base_query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Order by relevance if searching, otherwise by date
    if q:
        # Order by text search rank when searching
        base_query = base_query.order_by(
            text(
                "ts_rank(to_tsvector('english', text), plainto_tsquery('english', :query)) DESC"
            ).bindparams(query=q),
            Prompt.created_at.desc(),
        )
    else:
        base_query = base_query.order_by(Prompt.created_at.desc())

    # Apply pagination
    base_query = base_query.offset(offset).limit(limit)

    # Execute query
    result = await db.execute(base_query)
    prompts = result.scalars().all()

    return PromptSearchResponse(
        items=[
            PromptResponse(
                id=p.id,
                text=p.text,
                attributes=p.attributes,
                created_at=p.created_at,
                audio_sample_ids=[s.id for s in p.audio_samples],
            )
            for p in prompts
        ],
        total=total,
        page=page,
        limit=limit,
        query=q,
    )
