import math
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    ABTest,
    ABTestPair,
    ABTestStatus,
    Adapter,
    GenerationJob,
    JobStatus,
    Prompt,
)
from app.schemas import (
    ABTestCreate,
    ABTestDetailResponse,
    ABTestGenerateRequest,
    ABTestListResponse,
    ABTestPairResponse,
    ABTestResponse,
    ABTestResultsResponse,
    ABTestVoteRequest,
)
from app.services.generation import GenerationService

router = APIRouter(prefix="/ab-tests", tags=["ab-tests"])


async def _get_adapter_name(db: AsyncSession, adapter_id: UUID | None) -> str | None:
    if not adapter_id:
        return "Base Model"
    result = await db.execute(select(Adapter).where(Adapter.id == adapter_id))
    adapter = result.scalar_one_or_none()
    return f"{adapter.name} v{adapter.version}" if adapter else None


@router.get("", response_model=ABTestListResponse)
async def list_ab_tests(
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all A/B tests."""
    query = select(ABTest)

    if status:
        query = query.where(ABTest.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    query = query.order_by(ABTest.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    tests = result.scalars().all()

    items = []
    for test in tests:
        items.append(
            ABTestResponse(
                id=test.id,
                name=test.name,
                description=test.description,
                adapter_a_id=test.adapter_a_id,
                adapter_b_id=test.adapter_b_id,
                adapter_a_name=await _get_adapter_name(db, test.adapter_a_id),
                adapter_b_name=await _get_adapter_name(db, test.adapter_b_id),
                status=test.status.value,
                total_pairs=test.total_pairs,
                completed_pairs=test.completed_pairs,
                results=test.results,
                created_at=test.created_at,
                updated_at=test.updated_at,
            )
        )

    return ABTestListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ABTestResponse, status_code=201)
async def create_ab_test(
    data: ABTestCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new A/B test."""
    # Verify adapters exist if provided
    if data.adapter_a_id:
        result = await db.execute(
            select(Adapter).where(Adapter.id == data.adapter_a_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Adapter A not found")

    if data.adapter_b_id:
        result = await db.execute(
            select(Adapter).where(Adapter.id == data.adapter_b_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Adapter B not found")

    # Verify prompts exist
    for prompt_id in data.prompt_ids:
        result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")

    test = ABTest(
        name=data.name,
        description=data.description,
        adapter_a_id=data.adapter_a_id,
        adapter_b_id=data.adapter_b_id,
        prompt_ids=data.prompt_ids,
        results={"a_preferred": 0, "b_preferred": 0, "equal": 0},
    )
    db.add(test)
    await db.commit()
    await db.refresh(test)

    # Create pairs for each prompt
    for prompt_id in data.prompt_ids:
        pair = ABTestPair(
            ab_test_id=test.id,
            prompt_id=prompt_id,
        )
        db.add(pair)

    test.total_pairs = len(data.prompt_ids)
    await db.commit()
    await db.refresh(test)

    return ABTestResponse(
        id=test.id,
        name=test.name,
        description=test.description,
        adapter_a_id=test.adapter_a_id,
        adapter_b_id=test.adapter_b_id,
        adapter_a_name=await _get_adapter_name(db, test.adapter_a_id),
        adapter_b_name=await _get_adapter_name(db, test.adapter_b_id),
        status=test.status.value,
        total_pairs=test.total_pairs,
        completed_pairs=test.completed_pairs,
        results=test.results,
        created_at=test.created_at,
        updated_at=test.updated_at,
    )


@router.get("/{test_id}", response_model=ABTestDetailResponse)
async def get_ab_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get A/B test details including all pairs."""
    result = await db.execute(select(ABTest).where(ABTest.id == test_id))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")

    pairs_result = await db.execute(
        select(ABTestPair).where(ABTestPair.ab_test_id == test_id)
    )
    pairs = pairs_result.scalars().all()

    pair_responses = [
        ABTestPairResponse(
            id=pair.id,
            prompt_id=pair.prompt_id,
            audio_a_id=pair.audio_a_id,
            audio_b_id=pair.audio_b_id,
            preference=pair.preference,
            voted_at=pair.voted_at,
            is_ready=pair.audio_a_id is not None and pair.audio_b_id is not None,
        )
        for pair in pairs
    ]

    return ABTestDetailResponse(
        id=test.id,
        name=test.name,
        description=test.description,
        adapter_a_id=test.adapter_a_id,
        adapter_b_id=test.adapter_b_id,
        adapter_a_name=await _get_adapter_name(db, test.adapter_a_id),
        adapter_b_name=await _get_adapter_name(db, test.adapter_b_id),
        status=test.status.value,
        total_pairs=test.total_pairs,
        completed_pairs=test.completed_pairs,
        results=test.results,
        created_at=test.created_at,
        updated_at=test.updated_at,
        pairs=pair_responses,
    )


@router.post("/{test_id}/generate", response_model=ABTestResponse)
async def generate_ab_test_samples(
    test_id: UUID,
    _data: ABTestGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Generate audio samples for A/B test pairs."""
    result = await db.execute(select(ABTest).where(ABTest.id == test_id))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")

    # Get pairs that need generation
    pairs_result = await db.execute(
        select(ABTestPair)
        .where(ABTestPair.ab_test_id == test_id)
        .where(ABTestPair.audio_a_id.is_(None))  # Not yet generated
    )
    pairs = pairs_result.scalars().all()

    if not pairs:
        raise HTTPException(
            status_code=400, detail="All pairs already have audio samples"
        )

    # Create generation jobs for each pair
    seed = 42  # Use same seed for reproducibility
    for pair in pairs:
        # Job for adapter A
        job_a = GenerationJob(
            prompt_id=pair.prompt_id,
            adapter_id=test.adapter_a_id,
            num_samples=1,
            status=JobStatus.QUEUED,
            generation_params={"seed": seed},
        )
        db.add(job_a)
        await db.flush()
        pair.job_a_id = job_a.id

        # Job for adapter B
        job_b = GenerationJob(
            prompt_id=pair.prompt_id,
            adapter_id=test.adapter_b_id,
            num_samples=1,
            status=JobStatus.QUEUED,
            generation_params={"seed": seed},
        )
        db.add(job_b)
        await db.flush()
        pair.job_b_id = job_b.id

        # Queue generation tasks
        background_tasks.add_task(GenerationService.process_job, job_a.id)
        background_tasks.add_task(GenerationService.process_job, job_b.id)

    test.status = ABTestStatus.GENERATING
    test.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(test)

    return ABTestResponse(
        id=test.id,
        name=test.name,
        description=test.description,
        adapter_a_id=test.adapter_a_id,
        adapter_b_id=test.adapter_b_id,
        adapter_a_name=await _get_adapter_name(db, test.adapter_a_id),
        adapter_b_name=await _get_adapter_name(db, test.adapter_b_id),
        status=test.status.value,
        total_pairs=test.total_pairs,
        completed_pairs=test.completed_pairs,
        results=test.results,
        created_at=test.created_at,
        updated_at=test.updated_at,
    )


@router.post("/{test_id}/vote", response_model=ABTestPairResponse)
async def submit_vote(
    test_id: UUID,
    data: ABTestVoteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit a preference vote for an A/B test pair."""
    result = await db.execute(select(ABTest).where(ABTest.id == test_id))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")

    pair_result = await db.execute(
        select(ABTestPair)
        .where(ABTestPair.id == data.pair_id)
        .where(ABTestPair.ab_test_id == test_id)
    )
    pair = pair_result.scalar_one_or_none()

    if not pair:
        raise HTTPException(status_code=404, detail="Test pair not found")

    if not pair.audio_a_id or not pair.audio_b_id:
        raise HTTPException(status_code=400, detail="Audio samples not yet generated")

    # Record vote
    old_preference = pair.preference
    pair.preference = data.preference
    pair.voted_at = datetime.utcnow()

    # Update results
    results = test.results or {"a_preferred": 0, "b_preferred": 0, "equal": 0}

    # Undo old vote if re-voting
    if old_preference:
        if old_preference == "a":
            results["a_preferred"] = max(0, results.get("a_preferred", 0) - 1)
        elif old_preference == "b":
            results["b_preferred"] = max(0, results.get("b_preferred", 0) - 1)
        else:
            results["equal"] = max(0, results.get("equal", 0) - 1)
    else:
        test.completed_pairs += 1

    # Apply new vote
    if data.preference == "a":
        results["a_preferred"] = results.get("a_preferred", 0) + 1
    elif data.preference == "b":
        results["b_preferred"] = results.get("b_preferred", 0) + 1
    else:
        results["equal"] = results.get("equal", 0) + 1

    test.results = results
    test.updated_at = datetime.utcnow()

    # Check if test is complete
    if test.completed_pairs >= test.total_pairs:
        test.status = ABTestStatus.COMPLETED
    elif test.status == ABTestStatus.DRAFT:
        test.status = ABTestStatus.ACTIVE

    await db.commit()
    await db.refresh(pair)

    return ABTestPairResponse(
        id=pair.id,
        prompt_id=pair.prompt_id,
        audio_a_id=pair.audio_a_id,
        audio_b_id=pair.audio_b_id,
        preference=pair.preference,
        voted_at=pair.voted_at,
        is_ready=True,
    )


@router.get("/{test_id}/results", response_model=ABTestResultsResponse)
async def get_ab_test_results(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed results for an A/B test."""
    result = await db.execute(select(ABTest).where(ABTest.id == test_id))
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")

    results = test.results or {"a_preferred": 0, "b_preferred": 0, "equal": 0}
    total_votes = results["a_preferred"] + results["b_preferred"] + results["equal"]

    # Calculate win rates (excluding equal votes for comparison)
    comparison_votes = results["a_preferred"] + results["b_preferred"]
    a_win_rate = (
        results["a_preferred"] / comparison_votes if comparison_votes > 0 else 0.5
    )
    b_win_rate = (
        results["b_preferred"] / comparison_votes if comparison_votes > 0 else 0.5
    )

    # Calculate statistical significance (simple binomial test approximation)
    significance = None
    if comparison_votes >= 10:
        # Approximate p-value using normal approximation
        n = comparison_votes
        p_observed = a_win_rate
        p_expected = 0.5
        z = (p_observed - p_expected) / math.sqrt(p_expected * (1 - p_expected) / n)
        # Two-tailed p-value approximation
        significance = 2 * (
            1 - min(0.9999, 0.5 + 0.5 * math.erf(abs(z) / math.sqrt(2)))
        )

    return ABTestResultsResponse(
        id=test.id,
        name=test.name,
        adapter_a_name=await _get_adapter_name(db, test.adapter_a_id),
        adapter_b_name=await _get_adapter_name(db, test.adapter_b_id),
        total_votes=total_votes,
        a_preferred=results["a_preferred"],
        b_preferred=results["b_preferred"],
        equal=results["equal"],
        a_win_rate=a_win_rate,
        b_win_rate=b_win_rate,
        statistical_significance=significance,
    )
