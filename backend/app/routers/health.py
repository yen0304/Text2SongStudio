from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/")
async def root():
    return {
        "name": "Text2Song Studio API",
        "version": "0.1.0",
        "docs": "/docs",
    }
