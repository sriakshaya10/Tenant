import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.database.base import Base


class DriftExperiment(Base):
    __tablename__ = "drift_experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    baseline_dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    drift_config_json = Column(Text, nullable=True)
    results_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
