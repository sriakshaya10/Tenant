from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.generation_job import GenerationJob

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).count()
    total_records = db.query(func.sum(Dataset.record_count)).filter(
        Dataset.user_id == current_user.id
    ).scalar() or 0
    completed_jobs = db.query(GenerationJob).filter(
        GenerationJob.user_id == current_user.id,
        GenerationJob.status == "completed"
    ).count()
    failed_jobs = db.query(GenerationJob).filter(
        GenerationJob.user_id == current_user.id,
        GenerationJob.status == "failed"
    ).count()
    avg_quality = db.query(func.avg(Dataset.quality_score)).filter(
        Dataset.user_id == current_user.id,
        Dataset.quality_score.isnot(None)
    ).scalar()
    return {
        "total_datasets": total_datasets,
        "total_records": int(total_records),
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "avg_quality_score": round(float(avg_quality), 1) if avg_quality else None
    }


@router.get("/activity")
def get_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=30)
    datasets = db.query(Dataset).filter(
        Dataset.user_id == current_user.id,
        Dataset.created_at >= since
    ).all()

    daily = {}
    for d in datasets:
        day = d.created_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"date": day, "count": 0, "records": 0}
        daily[day]["count"] += 1
        daily[day]["records"] += d.record_count

    return {"activity": sorted(daily.values(), key=lambda x: x["date"])}
