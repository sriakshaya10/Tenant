import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.drift_experiment import DriftExperiment
from app.schemas.analytics import DriftSimulateRequest, DriftExperimentOut
from app.analytics.drift_analyzer import simulate_drift
import json

router = APIRouter(prefix="/drift", tags=["drift"])


@router.post("/simulate", response_model=DriftExperimentOut)
def simulate(req: DriftSimulateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == req.baseline_dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=400, detail="Dataset file not available")

    df = pd.read_csv(d.file_path)
    result = simulate_drift(df, req.drift_type, req.drift_magnitude)

    drift_config = {"drift_type": req.drift_type, "drift_magnitude": req.drift_magnitude}

    exp = DriftExperiment(
        id=str(uuid.uuid4()),
        baseline_dataset_id=req.baseline_dataset_id,
        user_id=current_user.id,
        drift_config_json=json.dumps(drift_config),
        results_json=result["results_json"]
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/experiments")
def list_experiments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exps = db.query(DriftExperiment).filter(DriftExperiment.user_id == current_user.id).order_by(DriftExperiment.created_at.desc()).all()
    return {"items": [DriftExperimentOut.model_validate(e) for e in exps]}
