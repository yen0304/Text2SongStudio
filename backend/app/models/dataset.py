import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DatasetType(str, Enum):
    SUPERVISED = "supervised"
    PREFERENCE = "preference"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(DatasetType), nullable=False)
    filter_query = Column(JSON, nullable=True, default=dict)
    sample_count = Column(Integer, default=0, nullable=False)
    export_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    trained_adapters = relationship(
        "Adapter", back_populates="training_dataset", lazy="selectin"
    )
    experiments = relationship("Experiment", back_populates="dataset", lazy="selectin")
