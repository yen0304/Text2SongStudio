import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AudioSample(Base):
    __tablename__ = "audio_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False)
    adapter_id = Column(UUID(as_uuid=True), ForeignKey("adapters.id"), nullable=True)
    storage_path = Column(String(500), nullable=False)
    duration_seconds = Column(Float, nullable=False)
    sample_rate = Column(Integer, nullable=False)
    generation_params = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="audio_samples")
    adapter = relationship("Adapter", back_populates="audio_samples")

    # Feedback models (industry standard RLHF)
    quality_ratings = relationship(
        "QualityRating",
        back_populates="audio_sample",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    tags = relationship(
        "AudioTag",
        back_populates="audio_sample",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    chosen_in_pairs = relationship(
        "PreferencePair",
        foreign_keys="[PreferencePair.chosen_audio_id]",
        back_populates="chosen_audio",
        lazy="selectin",
    )
    rejected_in_pairs = relationship(
        "PreferencePair",
        foreign_keys="[PreferencePair.rejected_audio_id]",
        back_populates="rejected_audio",
        lazy="selectin",
    )
