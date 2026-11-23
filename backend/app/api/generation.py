import uuid
import os
import json
import threading
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.dataset import Dataset
from app.models.generation_job import GenerationJob
from app.schemas.generation import GenerationRequest, JobOut

router = APIRouter(prefix="/generation", tags=["generation"])


def run_generation_job(job_id: str, dataset_id: str, config: dict):
    """Run generation in background thread."""
    from app.database.base import SessionLocal
    db = SessionLocal()
    try:
        job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not job or not dataset:
            return

        job.status = "running"
        job.started_at = datetime.utcnow()
        job.progress = 5
        db.commit()

        method = config.get("generation_method", "faker")

        if method == "faker":
            from app.generators.faker_generator import FakerGenerator
            gen = FakerGenerator(seed=config.get("seed"))
        elif method == "gaussian_copula":
            from app.generators.gaussian_copula import GaussianCopulaGenerator
            gen = GaussianCopulaGenerator(seed=config.get("seed"))
        elif method == "ctgan":
            from app.generators.ctgan_generator import CTGANGenerator
            gen = CTGANGenerator(seed=config.get("seed"))
        else:
            from app.generators.faker_generator import FakerGenerator
            gen = FakerGenerator(seed=config.get("seed"))

        job.progress = 20
        db.commit()

        df = gen.generate(config)

        job.progress = 80
        db.commit()

        # Save to storage
        storage_path = os.path.abspath(settings.STORAGE_PATH)
        os.makedirs(storage_path, exist_ok=True)
        file_path = os.path.join(storage_path, f"{dataset_id}.csv")
        df.to_csv(file_path, index=False)

        job.progress = 95
        db.commit()

        dataset.status = "completed"
        dataset.file_path = file_path
        dataset.record_count = len(df)
        job.status = "completed"
        job.progress = 100
        job.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        db.rollback()
        job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
        if dataset:
            dataset.status = "failed"
        db.commit()
    finally:
        db.close()


@router.post("/generate")
def generate(req: GenerationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.record_count > settings.MAX_RECORDS_LIMIT:
        raise HTTPException(status_code=400, detail=f"Max records limit is {settings.MAX_RECORDS_LIMIT}")

    dataset_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    config = req.model_dump()

    dataset = Dataset(
        id=dataset_id,
        user_id=current_user.id,
        name=req.name,
        description=req.description,
        record_count=req.record_count,
        generation_method=req.generation_method,
        scenario_id=req.scenario_id,
        seed=req.seed,
        config_json=json.dumps(config),
        status="pending"
    )
    db.add(dataset)

    job = GenerationJob(
        id=job_id,
        dataset_id=dataset_id,
        user_id=current_user.id,
        status="pending",
        progress=0
    )
    db.add(job)
    db.commit()

    thread = threading.Thread(target=run_generation_job, args=(job_id, dataset_id, config), daemon=True)
    thread.start()

    return {"job_id": job_id, "dataset_id": dataset_id, "status": "pending"}


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs")
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(GenerationJob).filter(GenerationJob.user_id == current_user.id).order_by(GenerationJob.created_at.desc()).limit(50).all()
    return {"items": [JobOut.model_validate(j) for j in jobs]}


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a finished job")
    job.status = "cancelled"
    db.commit()
    return {"detail": "Job cancelled"}
