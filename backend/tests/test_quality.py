"""Tests for quality validator."""
import pytest
import pandas as pd
from app.analytics.quality_validator import validate_quality
from app.generators.faker_generator import FakerGenerator


def test_quality_validate_returns_score():
    gen = FakerGenerator(seed=42)
    df = gen.generate({"record_count": 200})
    result = validate_quality(df)
    assert "overall_score" in result
    assert 0 <= result["overall_score"] <= 100


def test_quality_validate_has_all_fields():
    gen = FakerGenerator(seed=42)
    df = gen.generate({"record_count": 200})
    result = validate_quality(df)
    assert "column_scores_json" in result
    assert "distribution_metrics_json" in result
    assert "correlation_metrics_json" in result
    assert "missing_value_metrics_json" in result
    assert "warnings_json" in result


def test_quality_high_missing_generates_warning():
    gen = FakerGenerator(seed=42)
    df = gen.generate({"record_count": 200, "missing_value_pct": 0.5})
    result = validate_quality(df)
    import json
    warnings = json.loads(result["warnings_json"])
    assert len(warnings) > 0
