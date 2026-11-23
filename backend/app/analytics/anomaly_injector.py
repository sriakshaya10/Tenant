"""
Anomaly injector for rental applicant datasets.
Injects various types of anomalies for testing anomaly detection systems.
"""
import json
import numpy as np
import pandas as pd
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

ANOMALY_TYPES = [
    "extremely_high_income",
    "high_dti",
    "inconsistent_rent_income",
    "missing_credit",
    "unusual_income_variability",
    "conflicting_fields"
]


def inject_anomalies(df: pd.DataFrame, anomaly_type: str, pct_affected: float,
                     severity: float, seed: int) -> Dict[str, Any]:
    """Inject anomalies into dataset and return modified dataframe + report."""
    np.random.seed(seed)
    df = df.copy()
    n_affected = max(1, int(len(df) * pct_affected))
    affected_idx = np.random.choice(df.index, size=n_affected, replace=False)

    df["anomaly_type"] = "normal"

    if anomaly_type == "extremely_high_income":
        multiplier = 10 + severity * 5
        df.loc[affected_idx, "monthly_income"] = df.loc[affected_idx, "monthly_income"].fillna(5000) * multiplier
        df.loc[affected_idx, "anomaly_type"] = "extremely_high_income"

    elif anomaly_type == "high_dti":
        df.loc[affected_idx, "debt_to_income_ratio"] = np.random.uniform(0.8, 1.5 * severity, n_affected)
        df.loc[affected_idx, "existing_monthly_debt"] = (
            df.loc[affected_idx, "monthly_income"].fillna(5000) *
            df.loc[affected_idx, "debt_to_income_ratio"]
        )
        df.loc[affected_idx, "anomaly_type"] = "high_dti"

    elif anomaly_type == "inconsistent_rent_income":
        # Rent exceeds income
        if "monthly_income" in df.columns:
            df.loc[affected_idx, "monthly_rent"] = (
                df.loc[affected_idx, "monthly_income"].fillna(5000) * np.random.uniform(0.9, 1.5 * severity, n_affected)
            )
        df.loc[affected_idx, "anomaly_type"] = "inconsistent_rent_income"

    elif anomaly_type == "missing_credit":
        df.loc[affected_idx, "credit_score"] = None
        df.loc[affected_idx, "credit_history_length_months"] = None
        df.loc[affected_idx, "payment_history_score"] = None
        df.loc[affected_idx, "has_credit_history"] = 0
        df.loc[affected_idx, "anomaly_type"] = "missing_credit"

    elif anomaly_type == "unusual_income_variability":
        df.loc[affected_idx, "income_variability"] = np.random.uniform(0.7, min(1.0, 0.7 * severity), n_affected)
        df.loc[affected_idx, "anomaly_type"] = "unusual_income_variability"

    elif anomaly_type == "conflicting_fields":
        # Has all docs but no rental reference with high credit score but short history
        df.loc[affected_idx, "has_all_documents"] = 1
        df.loc[affected_idx, "has_rental_reference"] = 0
        df.loc[affected_idx, "credit_score"] = 800
        df.loc[affected_idx, "credit_history_length_months"] = 1
        df.loc[affected_idx, "anomaly_type"] = "conflicting_fields"

    n_anomalies = int((df["anomaly_type"] != "normal").sum())
    results = {
        "anomaly_type": anomaly_type,
        "records_affected": n_anomalies,
        "pct_affected": float(n_anomalies / len(df)),
        "severity": severity,
        "seed": seed,
        "total_records": len(df)
    }

    return {"df": df, "results_json": json.dumps(results)}
