"""Fairness analysis for rental screening models."""
import json
import numpy as np
import pandas as pd
from typing import Dict, Any
from app.ml.screening_model import create_target_variable, train_model, FEATURE_COLUMNS
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


def analyze_fairness(df: pd.DataFrame, group_column: str) -> Dict[str, Any]:
    """
    Analyze model fairness across demographic groups.
    Uses household_size, employment_type, rental_experience_years as group columns.
    NEVER uses protected characteristics.
    """
    y = create_target_variable(df)

    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[available_features].copy()
    imputer = SimpleImputer(strategy="median")
    X_imputed = imputer.fit_transform(X)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_predict
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    try:
        y_pred = cross_val_predict(model, X_scaled, y, cv=3)
    except Exception:
        model.fit(X_scaled, y)
        y_pred = model.predict(X_scaled)

    results = {}

    if group_column not in df.columns:
        # Create a proxy group
        group_col_data = pd.cut(df["household_size"].fillna(1), bins=[0, 1, 2, 10],
                                labels=["single", "couple", "family"]).astype(str)
    else:
        group_col_data = df[group_column].fillna("unknown").astype(str)

    for group in group_col_data.unique():
        mask = group_col_data == group
        if mask.sum() < 5:
            continue
        g_y = y[mask]
        g_pred = pd.Series(y_pred)[mask.values]
        tp = int(((g_pred == 1) & (g_y == 1)).sum())
        fp = int(((g_pred == 1) & (g_y == 0)).sum())
        tn = int(((g_pred == 0) & (g_y == 0)).sum())
        fn = int(((g_pred == 0) & (g_y == 1)).sum())
        n = len(g_y)
        results[group] = {
            "count": n,
            "selection_rate": float((g_pred == 1).mean()),
            "accuracy": float((g_pred == g_y.values).mean()),
            "fpr": float(fp / max(fp + tn, 1)),
            "fnr": float(fn / max(fn + tp, 1)),
            "tp": tp, "fp": fp, "tn": tn, "fn": fn
        }

    return {
        "group_column": group_column,
        "groups": results,
        "disclaimer": "Fairness analysis for research/audit purposes. Not a production screening tool."
    }
