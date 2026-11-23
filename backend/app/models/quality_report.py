import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database.base import Base


class QualityReport(Base):
    __tablename__ = "quality_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    column_scores_json = Column(Text, nullable=True)
    distribution_metrics_json = Column(Text, nullable=True)
    correlation_metrics_json = Column(Text, nullable=True)
    missing_value_metrics_json = Column(Text, nullable=True)
    warnings_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
