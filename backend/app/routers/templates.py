from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PromptTemplate
from app.schemas import (
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
)

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new user template."""
    template = PromptTemplate(
        name=data.name,
        description=data.description,
        text=data.text,
        attributes=data.attributes.model_dump() if data.attributes else {},
        category=data.category,
        is_system=False,  # User templates are never system templates
        user_id=None,  # TODO: Set from auth context when available
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        text=template.text,
        attributes=template.attributes,
        category=template.category,
        is_system=template.is_system,
        user_id=template.user_id,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a template by ID."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        text=template.text,
        attributes=template.attributes,
        category=template.category,
        is_system=template.is_system,
        user_id=template.user_id,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, description="Filter by category"),
    is_system: bool | None = Query(None, description="Filter by system/user templates"),
    db: AsyncSession = Depends(get_db),
):
    """List templates with optional filtering."""
    offset = (page - 1) * limit

    # Build query with filters
    query = select(PromptTemplate)
    count_query = select(func.count(PromptTemplate.id))

    if category is not None:
        query = query.where(PromptTemplate.category == category)
        count_query = count_query.where(PromptTemplate.category == category)

    if is_system is not None:
        query = query.where(PromptTemplate.is_system == is_system)
        count_query = count_query.where(PromptTemplate.is_system == is_system)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get templates (system first, then by created_at desc)
    result = await db.execute(
        query.order_by(
            PromptTemplate.is_system.desc(), PromptTemplate.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )
    templates = result.scalars().all()

    return TemplateListResponse(
        items=[
            TemplateResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                text=t.text,
                attributes=t.attributes,
                category=t.category,
                is_system=t.is_system,
                user_id=t.user_id,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in templates
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a user template. System templates cannot be modified."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.is_system:
        raise HTTPException(
            status_code=403, detail="System templates cannot be modified"
        )

    # Update fields if provided
    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.text is not None:
        template.text = data.text
    if data.attributes is not None:
        template.attributes = data.attributes.model_dump()
    if data.category is not None:
        template.category = data.category

    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        text=template.text,
        attributes=template.attributes,
        category=template.category,
        is_system=template.is_system,
        user_id=template.user_id,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a user template. System templates cannot be deleted."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.is_system:
        raise HTTPException(
            status_code=403, detail="System templates cannot be deleted"
        )

    await db.delete(template)
    await db.commit()


@router.get("/categories/list", response_model=list[str])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """List all unique template categories."""
    result = await db.execute(
        select(PromptTemplate.category)
        .where(PromptTemplate.category.isnot(None))
        .distinct()
        .order_by(PromptTemplate.category)
    )
    categories = [row[0] for row in result.fetchall()]
    return categories
