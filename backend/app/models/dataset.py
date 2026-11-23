import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from app.database.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    record_count = Column(Integer, nullable=False)
    generation_method = Column(String, nullable=False)
    scenario_id = Column(String, ForeignKey("applicant_scenarios.id"), nullable=True)
    seed = Column(Integer, nullable=True)
    config_json = Column(Text, nullable=True)
    status = Column(String, default="pending")
    quality_score = Column(Float, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = Column(Integer, default=1)
