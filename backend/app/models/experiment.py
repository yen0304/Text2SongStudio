import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ExperimentStatus(str, Enum):
    DRAFT = "DRAFT"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ARCHIVED = "ARCHIVED"


class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Experiment(Base):
    """Training experiment that groups multiple training runs."""

    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=True)
    status = Column(
        SQLEnum(ExperimentStatus), default=ExperimentStatus.DRAFT, nullable=False
    )
    config = Column(JSON, nullable=True, default=dict)  # Default training config
    best_run_id = Column(UUID(as_uuid=True), nullable=True)  # Best performing run
    best_loss = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    dataset = relationship("Dataset", back_populates="experiments")
    runs = relationship("ExperimentRun", back_populates="experiment", lazy="selectin")


class ExperimentRun(Base):
    """Individual training run within an experiment."""

    __tablename__ = "experiment_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experiment_id = Column(
        UUID(as_uuid=True), ForeignKey("experiments.id"), nullable=False
    )
    adapter_id = Column(
        UUID(as_uuid=True), ForeignKey("adapters.id"), nullable=True
    )  # Resulting adapter
    name = Column(String(100), nullable=True)  # e.g., "run-1", "run-2"
    status = Column(SQLEnum(RunStatus), default=RunStatus.PENDING, nullable=False)
    config = Column(JSON, nullable=True, default=dict)  # Override config for this run
    metrics = Column(JSON, nullable=True, default=dict)  # {loss: [...], lr: [...], ...}
    final_loss = Column(Float, nullable=True)
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    experiment = relationship("Experiment", back_populates="runs")
    adapter = relationship("Adapter", back_populates="training_runs")
