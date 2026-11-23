import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.database.base import Base


class FairnessExperiment(Base):
    __tablename__ = "fairness_experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    experiment_name = Column(String, nullable=False)
    group_column = Column(String, nullable=False)
    results_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
