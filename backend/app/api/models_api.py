import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.model_experiment import ModelExperiment
from app.schemas.analytics import ModelTrainRequest, ModelExperimentOut
from app.ml.screening_model import train_model

router = APIRouter(prefix="/models", tags=["models"])


@router.post("/train", response_model=ModelExperimentOut)
def train(req: ModelTrainRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=400, detail="Dataset file not available")

    df = pd.read_csv(d.file_path)
    if len(df) < 50:
        raise HTTPException(status_code=400, detail="Dataset too small for training (need 50+ records)")

    try:
        metrics = train_model(df, req.model_type, req.train_test_split, req.random_seed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

    exp = ModelExperiment(
        id=str(uuid.uuid4()),
        dataset_id=req.dataset_id,
        user_id=current_user.id,
        model_type=req.model_type,
        train_test_split=req.train_test_split,
        random_seed=req.random_seed,
        **metrics
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.post("/train/{dataset_id}", response_model=ModelExperimentOut)
def train_by_id(dataset_id: str, req: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model_req = ModelTrainRequest(
        dataset_id=dataset_id,
        model_type=req.get("model_type", "RandomForest"),
        train_test_split=req.get("train_test_split", 0.8),
        random_seed=req.get("random_seed", 42)
    )
    return train(model_req, current_user, db)


@router.get("/experiments")
def list_experiments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exps = db.query(ModelExperiment).filter(ModelExperiment.user_id == current_user.id).order_by(ModelExperiment.created_at.desc()).all()
    return {"items": [ModelExperimentOut.model_validate(e) for e in exps]}


@router.get("/experiments/{exp_id}", response_model=ModelExperimentOut)
def get_experiment(exp_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    e = db.query(ModelExperiment).filter(ModelExperiment.id == exp_id, ModelExperiment.user_id == current_user.id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return e
