import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.scenario import ApplicantScenario
from app.schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioUpdate

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("")
def list_scenarios(
    preset: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(ApplicantScenario).filter(
        (ApplicantScenario.user_id == current_user.id) | (ApplicantScenario.is_preset == True)
    )
    if preset is not None:
        q = q.filter(ApplicantScenario.is_preset == preset)
    scenarios = q.order_by(ApplicantScenario.is_preset.desc(), ApplicantScenario.name).all()
    return {"items": [ScenarioOut.model_validate(s) for s in scenarios]}


@router.post("", response_model=ScenarioOut)
def create_scenario(scenario_in: ScenarioCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = ApplicantScenario(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=scenario_in.name,
        description=scenario_in.description,
        scenario_type=scenario_in.scenario_type,
        config_json=scenario_in.config_json,
        is_preset=False
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.get("/{scenario_id}", response_model=ScenarioOut)
def get_scenario(scenario_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(ApplicantScenario).filter(
        ApplicantScenario.id == scenario_id,
        (ApplicantScenario.user_id == current_user.id) | (ApplicantScenario.is_preset == True)
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return s


@router.put("/{scenario_id}", response_model=ScenarioOut)
def update_scenario(scenario_id: str, update: ScenarioUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(ApplicantScenario).filter(
        ApplicantScenario.id == scenario_id,
        ApplicantScenario.user_id == current_user.id,
        ApplicantScenario.is_preset == False
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found or is a preset")
    if update.name:
        s.name = update.name
    if update.description is not None:
        s.description = update.description
    if update.config_json:
        s.config_json = update.config_json
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(ApplicantScenario).filter(
        ApplicantScenario.id == scenario_id,
        ApplicantScenario.user_id == current_user.id,
        ApplicantScenario.is_preset == False
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found or is a preset")
    db.delete(s)
    db.commit()
    return {"detail": "Scenario deleted"}
