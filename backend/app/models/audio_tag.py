"""Audio Tag model for categorization and filtering."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AudioTag(Base):
    """
    Tags for audio samples.

    Industry standard: Separate positive and negative tags for better filtering.
    Can be used to:
    - Filter training data (e.g., only samples tagged as 'good_melody')
    - Condition generation (e.g., generate with style tags)
    - Analyze model weaknesses (e.g., samples tagged as 'distorted')
    """

    __tablename__ = "audio_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audio_samples.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), nullable=True)
    tag = Column(String(100), nullable=False, index=True)

    # True = positive attribute (good_melody, creative)
    # False = negative attribute (noisy, distorted)
    is_positive = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    audio_sample = relationship("AudioSample", back_populates="tags")

    __table_args__ = (
        # One tag per audio per user
        UniqueConstraint(
            "audio_id", "tag", "user_id", name="uq_audio_tags_audio_tag_user"
        ),
        Index("ix_audio_tags_is_positive", "is_positive"),
    )

    def __repr__(self):
        polarity = "+" if self.is_positive else "-"
        return f"<AudioTag {self.id}: audio={self.audio_id} {polarity}{self.tag}>"


# Common tag definitions for consistency
POSITIVE_TAGS = [
    "good_melody",
    "good_rhythm",
    "good_harmony",
    "creative",
    "coherent",
    "high_quality",
    "matches_prompt",
    "natural_sound",
]

NEGATIVE_TAGS = [
    "bad_melody",
    "bad_rhythm",
    "noisy",
    "distorted",
    "off_key",
    "repetitive",
    "boring",
    "mismatch_prompt",
    "artifacts",
]

ALL_TAGS = POSITIVE_TAGS + NEGATIVE_TAGS
