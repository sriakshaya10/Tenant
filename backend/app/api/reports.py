import uuid
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.dataset import Dataset
from app.models.quality_report import QualityReport
from app.models.ai_report import AIReport
from app.schemas.analytics import ReportGenerateRequest, AIReportOut
from app.reports.report_generator import generate_report
import json

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate/{dataset_id}", response_model=AIReportOut)
def generate(dataset_id: str, req: ReportGenerateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")

    latest_quality = db.query(QualityReport).filter(QualityReport.dataset_id == dataset_id).order_by(QualityReport.created_at.desc()).first()
    quality_metrics = {}
    if latest_quality:
        quality_metrics = {
            "overall_score": latest_quality.overall_score,
            "warnings_json": latest_quality.warnings_json or "[]"
        }

    dataset_info = {
        "name": d.name,
        "record_count": d.record_count,
        "generation_method": d.generation_method,
        "created_at": d.created_at.isoformat() if d.created_at else "N/A",
        "quality_score": d.quality_score
    }

    result = generate_report(
        dataset_info=dataset_info,
        quality_metrics=quality_metrics,
        api_key=settings.OPENAI_API_KEY,
        gemini_key=settings.GEMINI_API_KEY,
        report_type=req.report_type
    )

    report = AIReport(
        id=str(uuid.uuid4()),
        dataset_id=dataset_id,
        user_id=current_user.id,
        report_type=req.report_type,
        content=result["content"],
        model_used=result["model_used"]
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}", response_model=AIReportOut)
def get_report(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(AIReport).filter(AIReport.id == report_id, AIReport.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return r


@router.get("/dataset/{dataset_id}")
def list_reports(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    reports = db.query(AIReport).filter(AIReport.dataset_id == dataset_id).order_by(AIReport.created_at.desc()).all()
    return {"items": [AIReportOut.model_validate(r) for r in reports]}
