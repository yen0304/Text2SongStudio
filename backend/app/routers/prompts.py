from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Prompt
from app.schemas import PromptCreate, PromptResponse, PromptListResponse

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
        select(Prompt)
        .order_by(Prompt.created_at.desc())
        .offset(offset)
        .limit(limit)
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
