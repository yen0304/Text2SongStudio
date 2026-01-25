import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, Float, Integer, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.database import Base


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), nullable=False)
    adapter_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)
    num_samples = Column(Integer, default=1, nullable=False)
    audio_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True, default=list)
    error = Column(Text, nullable=True)
    generation_params = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
