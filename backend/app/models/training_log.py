from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TrainingLog(Base):
    """Training log storage for capturing subprocess stdout/stderr."""

    __tablename__ = "training_logs"

    run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("experiment_runs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    data = Column(LargeBinary, default=b"", nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    run = relationship("ExperimentRun", back_populates="logs")
