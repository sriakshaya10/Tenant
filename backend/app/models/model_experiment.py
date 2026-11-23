import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from app.database.base import Base


class ModelExperiment(Base):
    __tablename__ = "model_experiments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    model_type = Column(String, nullable=False)
    train_test_split = Column(Float, nullable=False)
    random_seed = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    results_json = Column(Text, nullable=True)
    feature_importance_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
