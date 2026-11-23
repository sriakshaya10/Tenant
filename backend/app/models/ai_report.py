import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.database.base import Base


class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    report_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    model_used = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
