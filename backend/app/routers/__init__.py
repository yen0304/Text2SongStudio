# API Routers
from app.routers.ab_tests import router as ab_tests_router
from app.routers.adapters import router as adapters_router
from app.routers.adapters_v2 import router as adapters_v2_router
from app.routers.audio import router as audio_router
from app.routers.datasets import router as datasets_router
from app.routers.experiments import router as experiments_router
from app.routers.feedback import router as feedback_router
from app.routers.generation import router as generation_router
from app.routers.health import router as health_router
from app.routers.jobs import router as jobs_router
from app.routers.metrics import router as metrics_router
from app.routers.prompts import router as prompts_router

__all__ = [
    "health_router",
    "prompts_router",
    "generation_router",
    "audio_router",
    "feedback_router",
    "adapters_router",
    "adapters_v2_router",
    "datasets_router",
    "experiments_router",
    "ab_tests_router",
    "jobs_router",
    "metrics_router",
]
