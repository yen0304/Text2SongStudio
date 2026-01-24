import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audio_samples.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    rating = Column(Float, nullable=True)
    rating_criterion = Column(String(50), nullable=True, default="overall")
    preferred_over = Column(UUID(as_uuid=True), ForeignKey("audio_samples.id"), nullable=True)
    tags = Column(ARRAY(String), nullable=True, default=list)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    audio_sample = relationship(
        "AudioSample",
        foreign_keys=[audio_id],
        back_populates="feedback",
    )
    rejected_sample = relationship(
        "AudioSample",
        foreign_keys=[preferred_over],
    )
