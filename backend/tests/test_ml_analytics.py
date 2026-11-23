"""Comprehensive tests for ML screening, fairness, anomalies, drift, and report generation."""
import pytest
import json
import pandas as pd
from app.generators.faker_generator import FakerGenerator
from app.ml.screening_model import train_model, create_target_variable
from app.ml.fairness_analyzer import analyze_fairness
from app.analytics.anomaly_injector import inject_anomalies
from app.analytics.drift_analyzer import simulate_drift
from app.reports.report_generator import generate_report


@pytest.fixture
def sample_dataset():
    gen = FakerGenerator(seed=123)
    return gen.generate({"record_count": 300, "missing_value_pct": 0.02})


def test_target_variable_generation(sample_dataset):
    y = create_target_variable(sample_dataset)
    assert len(y) == len(sample_dataset)
    assert set(y.unique()).issubset({0, 1})
    assert y.sum() > 0


def test_ml_model_training_logistic_regression(sample_dataset):
    res = train_model(sample_dataset, "LogisticRegression", 0.8, 42)
    assert "accuracy" in res
    assert 0.0 <= res["accuracy"] <= 1.0
    assert "f1_score" in res
    assert "roc_auc" in res
    assert "results_json" in res


def test_ml_model_training_random_forest(sample_dataset):
    res = train_model(sample_dataset, "RandomForest", 0.75, 42)
    assert "accuracy" in res
    assert res["accuracy"] > 0.5
    feat_imp = json.loads(res["feature_importance_json"])
    assert len(feat_imp) > 0


def test_ml_model_training_gradient_boosting(sample_dataset):
    res = train_model(sample_dataset, "GradientBoosting", 0.8, 42)
    assert "accuracy" in res
    assert res["accuracy"] > 0.5


def test_fairness_analyzer(sample_dataset):
    fairness = analyze_fairness(sample_dataset, "employment_type")
    assert "groups" in fairness
    assert len(fairness["groups"]) > 0
    for group_name, metrics in fairness["groups"].items():
        assert "selection_rate" in metrics
        assert "fpr" in metrics
        assert "fnr" in metrics


def test_anomaly_injection(sample_dataset):
    res = inject_anomalies(sample_dataset, "extremely_high_income", 0.1, 1.0, 42)
    df_mod = res["df"]
    assert "anomaly_type" in df_mod.columns
    info = json.loads(res["results_json"])
    assert info["records_affected"] > 0


def test_drift_simulation(sample_dataset):
    res = simulate_drift(sample_dataset, "income_shift", 0.2)
    data = json.loads(res["results_json"])
    assert data["drift_type"] == "income_shift"
    assert "ks_statistics" in data


def test_report_generation_fallback(sample_dataset):
    dataset_info = {
        "name": "Test Synthetic Dataset",
        "record_count": 500,
        "generation_method": "faker",
        "quality_score": 92.5
    }
    quality_metrics = {
        "overall_score": 92.5,
        "warnings_json": "[]"
    }
    report = generate_report(
        dataset_info=dataset_info,
        quality_metrics=quality_metrics,
        api_key=None,
        gemini_key=None,
        report_type="executive"
    )
    assert "content" in report
    assert len(report["content"]) > 100
    assert report["model_used"] in ["template", "deterministic_template"]
