"""Tests for faker-based data generation."""
import pytest
from app.generators.faker_generator import FakerGenerator


def test_faker_generation_basic():
    gen = FakerGenerator(seed=42)
    df = gen.generate({"record_count": 100})
    assert len(df) == 100
    assert "applicant_id" in df.columns
    assert "monthly_income" in df.columns
    assert "credit_score" in df.columns


def test_faker_reproducibility():
    gen1 = FakerGenerator(seed=42)
    gen2 = FakerGenerator(seed=42)
    df1 = gen1.generate({"record_count": 50, "seed": 42, "missing_value_pct": 0})
    df2 = gen2.generate({"record_count": 50, "seed": 42, "missing_value_pct": 0})
    assert list(df1["credit_score"]) == list(df2["credit_score"])


def test_faker_income_range():
    gen = FakerGenerator(seed=1)
    df = gen.generate({"record_count": 200, "income_min": 3000, "income_max": 8000})
    # Most records should be in range (some may be slightly outside due to noise)
    in_range = ((df["monthly_income"] >= 1500) & (df["monthly_income"] <= 12000)).mean()
    assert in_range > 0.8


def test_faker_credit_range():
    gen = FakerGenerator(seed=5)
    df = gen.generate({"record_count": 100, "credit_min": 620, "credit_max": 800})
    assert df["credit_score"].min() >= 300
    assert df["credit_score"].max() <= 850


def test_faker_missing_values():
    gen = FakerGenerator(seed=10)
    df = gen.generate({"record_count": 200, "missing_value_pct": 0.1})
    total_missing = df.isnull().sum().sum()
    assert total_missing > 0


def test_faker_employment_types():
    gen = FakerGenerator(seed=7)
    df = gen.generate({"record_count": 100, "employment_types": ["full-time", "part-time"]})
    assert set(df["employment_type"].dropna().unique()).issubset({"full-time", "part-time"})
