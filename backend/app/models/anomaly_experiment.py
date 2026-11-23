import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from app.database.base import Base


class AnomalyExperiment(Base):
    __tablename__ = "anomaly_experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    anomaly_type = Column(String, nullable=False)
    pct_affected = Column(Float, nullable=False)
    severity = Column(Float, nullable=False)
    seed = Column(Integer, nullable=False)
    results_json = Column(Text, nullable=True)
    modified_file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
