import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TargetType(str, Enum):
    """Types of entities that can be favorited."""

    PROMPT = "prompt"
    AUDIO = "audio"


class Favorite(Base):
    """Polymorphic favorite/bookmark for prompts and audio samples."""

    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_type = Column(String(20), nullable=False)  # 'prompt' or 'audio'
    target_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # NULL until auth implemented
    note = Column(Text, nullable=True)  # Optional user note
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "target_type", "target_id", "user_id", name="uq_favorites_target_user"
        ),
    )
