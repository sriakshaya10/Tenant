import io
import os
import json
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset

router = APIRouter(prefix="/exports", tags=["exports"])


def _get_df(dataset_id: str, user_id: str, db: Session) -> pd.DataFrame:
    d = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not d.file_path or not os.path.exists(d.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found")
    return pd.read_csv(d.file_path), d.name


@router.get("/{dataset_id}/csv")
def export_csv(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    df, name = _get_df(dataset_id, current_user.id, db)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{name}.csv"'}
    )


@router.get("/{dataset_id}/xlsx")
def export_xlsx(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    df, name = _get_df(dataset_id, current_user.id, db)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Data")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{name}.xlsx"'}
    )


@router.get("/{dataset_id}/json")
def export_json(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    df, name = _get_df(dataset_id, current_user.id, db)
    data = df.to_dict(orient="records")
    return JSONResponse(content={"dataset": name, "records": data})
