from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime


class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None


class DatasetCreate(DatasetBase):
    record_count: int
    generation_method: str
    scenario_id: Optional[str] = None
    seed: Optional[int] = None
    config_json: Optional[str] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DatasetOut(DatasetBase):
    id: str
    user_id: str
    record_count: int
    generation_method: str
    scenario_id: Optional[str] = None
    seed: Optional[int] = None
    status: str
    quality_score: Optional[float] = None
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    version: int

    model_config = ConfigDict(from_attributes=True)
