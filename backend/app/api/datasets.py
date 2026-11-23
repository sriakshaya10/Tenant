import csv
import io
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetOut, DatasetUpdate
import pandas as pd
import os

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=dict)
def list_datasets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc())
    total = q.count()
    datasets = q.offset((page - 1) * limit).limit(limit).all()
    return {
        "items": [DatasetOut.model_validate(d) for d in datasets],
        "total": total, "page": page, "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return d


@router.put("/{dataset_id}", response_model=DatasetOut)
def update_dataset(dataset_id: str, update: DatasetUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if update.name:
        d.name = update.name
    if update.description is not None:
        d.description = update.description
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if d.file_path and os.path.exists(d.file_path):
        os.remove(d.file_path)
    db.delete(d)
    db.commit()
    return {"detail": "Dataset deleted"}


@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: str,
    limit: Optional[int] = Query(100, ge=1, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found")
    effective_limit = limit or 100
    df = pd.read_csv(d.file_path, nrows=effective_limit)
    rows = json.loads(df.to_json(orient="records"))
    return {
        "columns": list(df.columns),
        "rows": rows,
        "total_rows": d.record_count,
        "preview_count": len(rows),
        "dtypes": {c: str(df[c].dtype) for c in df.columns}
    }
