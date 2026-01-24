# API Routers
from app.routers.health import router as health_router
from app.routers.prompts import router as prompts_router
from app.routers.generation import router as generation_router
from app.routers.audio import router as audio_router
from app.routers.feedback import router as feedback_router
from app.routers.adapters import router as adapters_router
from app.routers.datasets import router as datasets_router

__all__ = [
    "health_router",
    "prompts_router",
    "generation_router",
    "audio_router",
    "feedback_router",
    "adapters_router",
    "datasets_router",
]
