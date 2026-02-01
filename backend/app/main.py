from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    ab_tests_router,
    adapters_router,
    audio_router,
    datasets_router,
    experiments_router,
    favorites_router,
    generation_router,
    health_router,
    jobs_router,
    logs_router,
    metrics_router,
    models_router,
    preferences_router,
    prompts_router,
    # New feedback system (industry standard)
    ratings_router,
    tags_router,
    templates_router,
)
from app.services.generation import GenerationService

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    await init_db()
    # Load persisted model selection from database
    await GenerationService.initialize()
    yield
    # Shutdown


app = FastAPI(
    title=settings.app_name,
    description="Human-in-the-loop text-to-music generation platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(prompts_router)
app.include_router(generation_router)
app.include_router(audio_router)
app.include_router(adapters_router)
app.include_router(datasets_router)
app.include_router(experiments_router)
app.include_router(ab_tests_router)
app.include_router(jobs_router)
app.include_router(logs_router)
app.include_router(metrics_router)
app.include_router(models_router)
# New feedback system (industry standard)
app.include_router(ratings_router)
app.include_router(preferences_router)
app.include_router(tags_router)
# Templates and Favorites
app.include_router(templates_router)
app.include_router(favorites_router)
