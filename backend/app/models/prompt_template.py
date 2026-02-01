import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class PromptTemplate(Base):
    """Reusable prompt template with predefined text and attributes."""

    __tablename__ = "prompt_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    text = Column(Text, nullable=False)
    attributes = Column(JSON, nullable=True, default=dict)
    category = Column(String(50), nullable=True)  # e.g., 'electronic', 'classical'
    is_system = Column(Boolean, nullable=False, default=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # NULL for system templates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
