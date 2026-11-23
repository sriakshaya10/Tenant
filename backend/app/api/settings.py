from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])

# In-memory settings store (extend with DB if needed)
_user_settings = {}


@router.get("")
def get_settings(current_user: User = Depends(get_current_user)):
    defaults = {
        "theme": "light",
        "notifications_enabled": True,
        "default_generation_method": "faker",
        "default_record_count": 1000
    }
    user_prefs = _user_settings.get(current_user.id, {})
    return {**defaults, **user_prefs}


@router.put("")
def update_settings(settings_update: dict, current_user: User = Depends(get_current_user)):
    if current_user.id not in _user_settings:
        _user_settings[current_user.id] = {}
    _user_settings[current_user.id].update(settings_update)
    return _user_settings[current_user.id]
