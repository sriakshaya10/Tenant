from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime


class GenerationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    record_count: int = 1000
    generation_method: str = "faker"
    scenario_id: Optional[str] = None
    seed: Optional[int] = None
    income_min: Optional[float] = 2000
    income_max: Optional[float] = 15000
    rent_min: Optional[float] = 500
    rent_max: Optional[float] = 4000
    credit_min: Optional[int] = 580
    credit_max: Optional[int] = 820
    employment_types: Optional[List[str]] = None
    missing_value_pct: Optional[float] = 0.05
    ctgan_epochs: Optional[int] = 100


class JobOut(BaseModel):
    id: str
    dataset_id: str
    user_id: str
    status: str
    progress: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
