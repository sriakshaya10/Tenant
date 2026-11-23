import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.fairness_experiment import FairnessExperiment
from app.schemas.analytics import FairnessRequest, FairnessExperimentOut
from app.ml.fairness_analyzer import analyze_fairness
import json

router = APIRouter(prefix="/fairness", tags=["fairness"])


@router.post("/analyze", response_model=FairnessExperimentOut)
def analyze(req: FairnessRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=400, detail="Dataset file not available")

    df = pd.read_csv(d.file_path)
    results = analyze_fairness(df, req.group_column)

    exp = FairnessExperiment(
        id=str(uuid.uuid4()),
        dataset_id=req.dataset_id,
        user_id=current_user.id,
        experiment_name=req.experiment_name,
        group_column=req.group_column,
        results_json=json.dumps(results)
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/experiments")
def list_experiments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exps = db.query(FairnessExperiment).filter(FairnessExperiment.user_id == current_user.id).order_by(FairnessExperiment.created_at.desc()).all()
    return {"items": [FairnessExperimentOut.model_validate(e) for e in exps]}
