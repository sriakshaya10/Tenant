from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime


class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str
    config_json: str


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config_json: Optional[str] = None


class ScenarioOut(ScenarioBase):
    id: str
    user_id: Optional[str] = None
    is_preset: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
