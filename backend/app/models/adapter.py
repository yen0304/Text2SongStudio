import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Adapter(Base):
    __tablename__ = "adapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    base_model = Column(String(200), nullable=False)
    storage_path = Column(String(500), nullable=False)
    training_dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=True)
    training_config = Column(JSON, nullable=True, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Unique constraint on name + version
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

    # Relationships
    audio_samples = relationship("AudioSample", back_populates="adapter", lazy="selectin")
    training_dataset = relationship("Dataset", back_populates="trained_adapters")
