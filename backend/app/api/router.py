from fastapi import APIRouter
from app.api import auth, dashboard, datasets, generation, scenarios, quality, models_api
from app.api import fairness, anomalies, drift, reports, exports, settings

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(datasets.router)
api_router.include_router(generation.router)
api_router.include_router(scenarios.router)
api_router.include_router(quality.router)
api_router.include_router(models_api.router)
api_router.include_router(fairness.router)
api_router.include_router(anomalies.router)
api_router.include_router(drift.router)
api_router.include_router(reports.router)
api_router.include_router(exports.router)
api_router.include_router(settings.router)
