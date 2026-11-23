import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.quality_report import QualityReport
from app.schemas.analytics import QualityReportOut
from app.analytics.quality_validator import validate_quality

router = APIRouter(prefix="/quality", tags=["quality"])


@router.post("/analyze/{dataset_id}", response_model=QualityReportOut)
@router.post("/validate/{dataset_id}", response_model=QualityReportOut)
def analyze_quality(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=400, detail="Dataset file not available")

    df = pd.read_csv(d.file_path)
    result = validate_quality(df)

    # Update dataset quality score
    d.quality_score = result["overall_score"]
    db.commit()

    report = QualityReport(
        id=str(uuid.uuid4()),
        dataset_id=dataset_id,
        **result
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports/{dataset_id}")
def get_quality_reports(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    reports = db.query(QualityReport).filter(QualityReport.dataset_id == dataset_id).order_by(QualityReport.created_at.desc()).all()
    return {"items": [QualityReportOut.model_validate(r) for r in reports]}
