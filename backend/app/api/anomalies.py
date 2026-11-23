import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.anomaly_experiment import AnomalyExperiment
from app.schemas.analytics import AnomalyInjectRequest, AnomalyExperimentOut
from app.analytics.anomaly_injector import inject_anomalies
from app.core.config import settings

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.post("/inject", response_model=AnomalyExperimentOut)
def inject(req: AnomalyInjectRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=400, detail="Dataset file not available")

    df = pd.read_csv(d.file_path)
    result = inject_anomalies(df, req.anomaly_type, req.pct_affected, req.severity, req.seed)

    # Save modified file
    storage_path = os.path.abspath(settings.STORAGE_PATH)
    os.makedirs(storage_path, exist_ok=True)
    exp_id = str(uuid.uuid4())
    modified_path = os.path.join(storage_path, f"anomaly_{exp_id}.csv")
    result["df"].to_csv(modified_path, index=False)

    exp = AnomalyExperiment(
        id=exp_id,
        dataset_id=req.dataset_id,
        user_id=current_user.id,
        anomaly_type=req.anomaly_type,
        pct_affected=req.pct_affected,
        severity=req.severity,
        seed=req.seed,
        results_json=result["results_json"],
        modified_file_path=modified_path
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/experiments")
def list_experiments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exps = db.query(AnomalyExperiment).filter(AnomalyExperiment.user_id == current_user.id).order_by(AnomalyExperiment.created_at.desc()).all()
    return {"items": [AnomalyExperimentOut.model_validate(e) for e in exps]}
