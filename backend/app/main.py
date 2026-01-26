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
    feedback_router,
    generation_router,
    health_router,
    jobs_router,
    logs_router,
    metrics_router,
    prompts_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    await init_db()
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
app.include_router(feedback_router)
app.include_router(adapters_router)
app.include_router(datasets_router)
app.include_router(experiments_router)
app.include_router(ab_tests_router)
app.include_router(jobs_router)
app.include_router(logs_router)
app.include_router(metrics_router)
