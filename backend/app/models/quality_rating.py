"""Quality Rating model for SFT training data."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class QualityRating(Base):
    """
    Quality ratings for audio samples.
    Used for Supervised Fine-Tuning (SFT) - training on high-quality examples.

    Industry standard: Collect ratings on multiple criteria for better filtering.
    """

    __tablename__ = "quality_ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audio_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audio_samples.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), nullable=True)
    rating = Column(Float, nullable=False)  # 1-5 scale
    criterion = Column(String(50), nullable=False, default="overall")
    # Criteria examples: overall, melody, rhythm, harmony, coherence, creativity
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    audio_sample = relationship("AudioSample", back_populates="quality_ratings")

    __table_args__ = (Index("ix_quality_ratings_rating", "rating"),)

    def __repr__(self):
        return f"<QualityRating {self.id}: audio={self.audio_id} rating={self.rating} criterion={self.criterion}>"
