import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ABTestStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    ACTIVE = "active"
    COMPLETED = "completed"


class ABTest(Base):
    """A/B test comparing two adapters."""

    __tablename__ = "ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    adapter_a_id = Column(
        UUID(as_uuid=True), ForeignKey("adapters.id"), nullable=True
    )  # None = base model
    adapter_b_id = Column(
        UUID(as_uuid=True), ForeignKey("adapters.id"), nullable=True
    )  # None = base model
    status = Column(SQLEnum(ABTestStatus), default=ABTestStatus.DRAFT, nullable=False)
    prompt_ids = Column(
        ARRAY(UUID(as_uuid=True)), nullable=True, default=list
    )  # Test prompts
    results = Column(
        JSON, nullable=True, default=dict
    )  # {a_preferred: 5, b_preferred: 8, equal: 2}
    total_pairs = Column(Integer, default=0)
    completed_pairs = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    adapter_a = relationship("Adapter", foreign_keys=[adapter_a_id])
    adapter_b = relationship("Adapter", foreign_keys=[adapter_b_id])
    pairs = relationship("ABTestPair", back_populates="ab_test", lazy="selectin")


class ABTestPair(Base):
    """A single comparison pair in an A/B test."""

    __tablename__ = "ab_test_pairs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"), nullable=False)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    audio_a_id = Column(
        UUID(as_uuid=True), ForeignKey("audio_samples.id"), nullable=True
    )
    audio_b_id = Column(
        UUID(as_uuid=True), ForeignKey("audio_samples.id"), nullable=True
    )
    job_a_id = Column(
        UUID(as_uuid=True), ForeignKey("generation_jobs.id"), nullable=True
    )
    job_b_id = Column(
        UUID(as_uuid=True), ForeignKey("generation_jobs.id"), nullable=True
    )
    preference = Column(
        String(10), nullable=True
    )  # 'a', 'b', 'equal', None (not voted)
    voted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    ab_test = relationship("ABTest", back_populates="pairs")
    prompt = relationship("Prompt")
    audio_a = relationship("AudioSample", foreign_keys=[audio_a_id])
    audio_b = relationship("AudioSample", foreign_keys=[audio_b_id])
