"""Preference Pair model for DPO/RLHF training data."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PreferencePair(Base):
    """
    Preference pairs for DPO (Direct Preference Optimization) or RLHF training.

    Industry standard: Each pair must be from the SAME prompt to ensure valid comparison.
    The 'margin' field can indicate how much better the chosen sample is.
    """

    __tablename__ = "preference_pairs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # CRITICAL: prompt_id ensures both samples are from the same prompt
    prompt_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prompts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The preferred/better sample
    chosen_audio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audio_samples.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The rejected/worse sample
    rejected_audio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audio_samples.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(UUID(as_uuid=True), nullable=True)

    # Optional: How much better is chosen vs rejected (1.0 = slightly, 5.0 = much better)
    margin = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="preference_pairs")
    chosen_audio = relationship(
        "AudioSample", foreign_keys=[chosen_audio_id], back_populates="chosen_in_pairs"
    )
    rejected_audio = relationship(
        "AudioSample",
        foreign_keys=[rejected_audio_id],
        back_populates="rejected_in_pairs",
    )

    __table_args__ = (
        # Ensure chosen and rejected are different
        CheckConstraint(
            "chosen_audio_id != rejected_audio_id",
            name="ck_preference_pairs_different_audios",
        ),
    )

    def __repr__(self):
        return f"<PreferencePair {self.id}: prompt={self.prompt_id} chosen={self.chosen_audio_id} rejected={self.rejected_audio_id}>"
