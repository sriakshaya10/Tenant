from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ModelTrainRequest(BaseModel):
    dataset_id: str
    model_type: str = "RandomForest"
    train_test_split: float = 0.8
    random_seed: int = 42


class ModelExperimentOut(BaseModel):
    id: str
    dataset_id: str
    user_id: str
    model_type: str
    train_test_split: float
    random_seed: int
    accuracy: Optional[float] = None
    precision_score: Optional[float] = None
    recall_score: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    results_json: Optional[str] = None
    feature_importance_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QualityAnalysisRequest(BaseModel):
    dataset_id: str


class QualityReportOut(BaseModel):
    id: str
    dataset_id: str
    overall_score: float
    column_scores_json: Optional[str] = None
    distribution_metrics_json: Optional[str] = None
    correlation_metrics_json: Optional[str] = None
    missing_value_metrics_json: Optional[str] = None
    warnings_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FairnessRequest(BaseModel):
    dataset_id: str
    experiment_name: str
    group_column: str


class FairnessExperimentOut(BaseModel):
    id: str
    dataset_id: str
    user_id: str
    experiment_name: str
    group_column: str
    results_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalyInjectRequest(BaseModel):
    dataset_id: str
    anomaly_type: str
    pct_affected: float = 0.05
    severity: float = 1.0
    seed: int = 42


class AnomalyExperimentOut(BaseModel):
    id: str
    dataset_id: str
    user_id: str
    anomaly_type: str
    pct_affected: float
    severity: float
    seed: int
    results_json: Optional[str] = None
    modified_file_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriftSimulateRequest(BaseModel):
    baseline_dataset_id: str
    drift_type: str = "income_shift"
    drift_magnitude: float = 0.2


class DriftExperimentOut(BaseModel):
    id: str
    baseline_dataset_id: str
    user_id: str
    drift_config_json: Optional[str] = None
    results_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportGenerateRequest(BaseModel):
    report_type: str = "comprehensive"


class AIReportOut(BaseModel):
    id: str
    dataset_id: str
    user_id: str
    report_type: str
    content: str
    model_used: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
