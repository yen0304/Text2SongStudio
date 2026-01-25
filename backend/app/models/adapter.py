import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Adapter(Base):
    __tablename__ = "adapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=True)  # Legacy field
    description = Column(Text, nullable=True)
    base_model = Column(String(200), nullable=False, default="musicgen-small")
    storage_path = Column(String(500), nullable=True)
    training_dataset_id = Column(
        UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=True
    )
    training_config = Column(JSON, nullable=True, default=dict)
    config = Column(JSON, nullable=True, default=dict)  # New config field
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, archived
    current_version = Column(String(20), nullable=True)  # Points to active version
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Unique constraint on name + version
    __table_args__ = ({"sqlite_autoincrement": True},)

    # Relationships
    audio_samples = relationship(
        "AudioSample", back_populates="adapter", lazy="selectin"
    )
    training_dataset = relationship("Dataset", back_populates="trained_adapters")
    training_runs = relationship(
        "ExperimentRun", back_populates="adapter", lazy="selectin"
    )
    versions = relationship(
        "AdapterVersion",
        back_populates="adapter",
        lazy="selectin",
        order_by="AdapterVersion.created_at.desc()",
    )


class AdapterVersion(Base):
    """Tracks different versions of an adapter over time."""

    __tablename__ = "adapter_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adapter_id = Column(
        UUID(as_uuid=True),
        ForeignKey("adapters.id", ondelete="CASCADE"),
        nullable=False,
    )
    version = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    weights_path = Column(String(500), nullable=True)
    metrics = Column(
        JSON, nullable=True, default=dict
    )  # Stores training metrics at time of version
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    adapter = relationship("Adapter", back_populates="versions")
