"""
Drift analyzer - simulate data distribution changes.
"""
import json
import numpy as np
import pandas as pd
from typing import Dict, Any
from scipy import stats
import logging

logger = logging.getLogger(__name__)

DRIFT_TYPES = [
    "increased_self_employment",
    "income_shift",
    "rent_shift",
    "credit_shift",
    "missing_docs_increase"
]


def simulate_drift(df: pd.DataFrame, drift_type: str, drift_magnitude: float) -> Dict[str, Any]:
    """Simulate drift in dataset and compute KS statistics."""
    baseline_df = df.copy()
    drifted_df = df.copy()

    if drift_type == "income_shift":
        shift = drift_magnitude * drifted_df["monthly_income"].mean() if "monthly_income" in drifted_df.columns else 0
        drifted_df["monthly_income"] = drifted_df["monthly_income"].fillna(0) + shift

    elif drift_type == "rent_shift":
        shift = drift_magnitude * drifted_df["monthly_rent"].mean() if "monthly_rent" in drifted_df.columns else 0
        drifted_df["monthly_rent"] = drifted_df["monthly_rent"].fillna(0) + shift

    elif drift_type == "credit_shift":
        shift = drift_magnitude * 50
        drifted_df["credit_score"] = (drifted_df["credit_score"].fillna(650) + shift).clip(300, 850)

    elif drift_type == "increased_self_employment":
        n_shift = int(len(drifted_df) * drift_magnitude)
        idx = np.random.choice(drifted_df.index, size=n_shift, replace=False)
        drifted_df.loc[idx, "employment_type"] = "self-employed"

    elif drift_type == "missing_docs_increase":
        n_shift = int(len(drifted_df) * drift_magnitude)
        idx = np.random.choice(drifted_df.index, size=n_shift, replace=False)
        drifted_df.loc[idx, "has_all_documents"] = 0

    # Compute KS statistics per numeric column
    ks_results = {}
    numeric_cols = baseline_df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        base_vals = baseline_df[col].dropna().values
        drift_vals = drifted_df[col].dropna().values
        if len(base_vals) > 0 and len(drift_vals) > 0:
            ks_stat, ks_p = stats.ks_2samp(base_vals, drift_vals)
            ks_results[col] = {
                "ks_statistic": float(ks_stat),
                "ks_pvalue": float(ks_p),
                "drifted": bool(ks_stat > 0.1)
            }

    drifted_cols = [c for c, v in ks_results.items() if v.get("drifted")]
    results = {
        "drift_type": drift_type,
        "drift_magnitude": drift_magnitude,
        "total_records": len(df),
        "drifted_columns": drifted_cols,
        "ks_statistics": ks_results,
        "summary": f"Detected drift in {len(drifted_cols)} columns using KS test (threshold 0.1)"
    }

    return {"results_json": json.dumps(results)}
