# API Routers
from app.routers.ab_tests import router as ab_tests_router
from app.routers.adapters import router as adapters_router
from app.routers.audio import router as audio_router
from app.routers.datasets import router as datasets_router
from app.routers.experiments import router as experiments_router
from app.routers.generation import router as generation_router
from app.routers.health import router as health_router
from app.routers.jobs import router as jobs_router
from app.routers.logs import router as logs_router
from app.routers.metrics import router as metrics_router
from app.routers.preferences import router as preferences_router
from app.routers.prompts import router as prompts_router

# New feedback system (industry standard)
from app.routers.ratings import router as ratings_router
from app.routers.tags import router as tags_router

__all__ = [
    "health_router",
    "prompts_router",
    "generation_router",
    "audio_router",
    "adapters_router",
    "datasets_router",
    "experiments_router",
    "ab_tests_router",
    "jobs_router",
    "logs_router",
    "metrics_router",
    # New feedback system (industry standard)
    "ratings_router",
    "preferences_router",
    "tags_router",
]
