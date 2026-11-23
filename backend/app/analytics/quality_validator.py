"""
Data quality validator for synthetic rental applicant datasets.
Compares generated data against reference distributions.
"""
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from scipy import stats
from app.generators.reference_data import build_reference_data
import logging

logger = logging.getLogger(__name__)

NUMERIC_COLS = [
    "monthly_income", "monthly_rent", "rent_to_income_ratio", "savings",
    "existing_monthly_debt", "debt_to_income_ratio",
    "employment_duration_months", "employment_stability", "income_variability",
    "credit_score", "credit_history_length_months", "payment_history_score",
    "prev_rental_duration_months", "prev_rent_payment_score",
    "rental_experience_years", "household_size", "num_dependents",
    "num_references", "application_completeness"
]

CATEGORICAL_COLS = ["employment_type", "desired_property_type", "rental_market_scenario"]


def validate_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """Run quality validation and return a comprehensive report."""
    ref_df = build_reference_data(n=500, seed=42)

    column_scores = {}
    distribution_metrics = {}
    warnings = []

    # Numeric column analysis
    for col in NUMERIC_COLS:
        if col not in df.columns:
            continue
        gen_vals = df[col].dropna()
        ref_vals = ref_df[col].dropna() if col in ref_df.columns else None

        col_score = 100.0
        col_metrics = {
            "mean": float(gen_vals.mean()) if len(gen_vals) > 0 else None,
            "std": float(gen_vals.std()) if len(gen_vals) > 0 else None,
            "min": float(gen_vals.min()) if len(gen_vals) > 0 else None,
            "max": float(gen_vals.max()) if len(gen_vals) > 0 else None,
            "missing_pct": float((df[col].isna().sum() / len(df)) * 100)
        }

        if ref_vals is not None and len(gen_vals) > 0:
            # KS statistic
            ks_stat, ks_p = stats.ks_2samp(gen_vals.values, ref_vals.values)
            col_metrics["ks_statistic"] = float(ks_stat)
            col_metrics["ks_pvalue"] = float(ks_p)
            # Score penalty based on KS stat
            col_score -= ks_stat * 50

        # Missing value penalty
        missing_pct = col_metrics["missing_pct"]
        if missing_pct > 30:
            col_score -= 20
            warnings.append(f"High missing rate in {col}: {missing_pct:.1f}%")
        elif missing_pct > 15:
            col_score -= 10

        column_scores[col] = max(0, min(100, col_score))
        distribution_metrics[col] = col_metrics

    # Categorical column analysis
    for col in CATEGORICAL_COLS:
        if col not in df.columns:
            continue
        gen_counts = df[col].value_counts(normalize=True)
        col_metrics = {"value_distribution": gen_counts.to_dict(), "missing_pct": float(df[col].isna().mean() * 100)}
        distribution_metrics[col] = col_metrics
        column_scores[col] = 90.0  # Base score for categoricals

    # Duplicate detection
    dup_pct = float(df.duplicated().mean() * 100)
    if dup_pct > 5:
        warnings.append(f"High duplicate rate: {dup_pct:.1f}%")

    # Correlation matrix
    numeric_df = df.select_dtypes(include=[np.number])
    corr_metrics = {}
    if len(numeric_df.columns) > 1:
        try:
            corr = numeric_df.corr().fillna(0)
            corr_metrics = {"columns": list(corr.columns), "matrix": corr.values.tolist()}
        except Exception:
            pass

    # Missing value summary
    missing_summary = {col: float(df[col].isna().mean() * 100) for col in df.columns}

    # Constraint violations
    violations = []
    if "monthly_income" in df.columns and "monthly_rent" in df.columns:
        bad_ratio = (df["monthly_income"].fillna(0) < df["monthly_rent"].fillna(0)).mean()
        if bad_ratio > 0.1:
            violations.append(f"{bad_ratio*100:.1f}% of records have income < rent")
    if "household_size" in df.columns and "num_dependents" in df.columns:
        bad_dep = (df["num_dependents"].fillna(0) >= df["household_size"].fillna(1)).mean()
        if bad_dep > 0.1:
            violations.append(f"{bad_dep*100:.1f}% of records have dependents >= household_size")

    if violations:
        warnings.extend(violations)

    # Overall score
    if column_scores:
        overall_score = float(np.mean(list(column_scores.values())))
        if dup_pct > 5:
            overall_score -= 5
        overall_score = max(0, min(100, overall_score))
    else:
        overall_score = 50.0

    return {
        "overall_score": overall_score,
        "column_scores_json": json.dumps(column_scores),
        "distribution_metrics_json": json.dumps(distribution_metrics),
        "correlation_metrics_json": json.dumps(corr_metrics),
        "missing_value_metrics_json": json.dumps(missing_summary),
        "warnings_json": json.dumps(warnings)
    }
