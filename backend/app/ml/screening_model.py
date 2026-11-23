"""
Screening Model - ML training for rental applicant qualification prediction.
NOTE: This is for RESEARCH/TESTING PURPOSES ONLY.
Protected characteristics (race, gender, religion, national_origin) are NEVER used as features.
"""
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, confusion_matrix)
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import logging

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "monthly_income", "monthly_rent", "rent_to_income_ratio", "savings",
    "existing_monthly_debt", "debt_to_income_ratio",
    "employment_duration_months", "employment_stability", "income_variability",
    "credit_score", "credit_history_length_months", "has_credit_history",
    "payment_history_score", "prev_rental_duration_months", "prev_rent_payment_score",
    "has_rental_reference", "rental_experience_years",
    "household_size", "num_dependents",
    "has_all_documents", "num_references", "application_completeness"
]

MODEL_MAP = {
    "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
    "DecisionTree": DecisionTreeClassifier(max_depth=8, random_state=42),
    "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
    "GradientBoosting": GradientBoostingClassifier(n_estimators=100, random_state=42)
}


def create_target_variable(df: pd.DataFrame) -> pd.Series:
    """
    Create synthetic 'likely_qualified' target using documented business rules.
    Rules:
      1. monthly_income >= 2.5 * monthly_rent
      2. credit_score >= 620
      3. debt_to_income_ratio < 0.4
      4. employment_duration_months >= 6
      5. payment_history_score >= 60
    Score each rule, threshold at 3+/5 to qualify.
    """
    scores = pd.Series(0, index=df.index)

    if "monthly_income" in df.columns and "monthly_rent" in df.columns:
        scores += ((df["monthly_income"].fillna(0) >= 2.5 * df["monthly_rent"].fillna(1)).astype(int))

    if "credit_score" in df.columns:
        scores += (df["credit_score"].fillna(0) >= 620).astype(int)

    if "debt_to_income_ratio" in df.columns:
        scores += (df["debt_to_income_ratio"].fillna(1.0) < 0.4).astype(int)

    if "employment_duration_months" in df.columns:
        scores += (df["employment_duration_months"].fillna(0) >= 6).astype(int)

    if "payment_history_score" in df.columns:
        scores += (df["payment_history_score"].fillna(0) >= 60).astype(int)

    return (scores >= 3).astype(int)


def train_model(df: pd.DataFrame, model_type: str, train_test_split_ratio: float,
                random_seed: int) -> Dict[str, Any]:
    """Train a screening model and return metrics."""
    # Create target
    y = create_target_variable(df)

    # Select available features
    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[available_features].copy()

    # Impute and scale
    imputer = SimpleImputer(strategy="median")
    X_imputed = imputer.fit_transform(X)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=1 - train_test_split_ratio, random_state=random_seed
    )

    model_cls = MODEL_MAP.get(model_type)
    if model_cls is None:
        raise ValueError(f"Unknown model type: {model_type}")

    # Create a fresh instance with the random seed
    if hasattr(model_cls, "random_state"):
        model_cls.set_params(random_state=random_seed)

    model_cls.fit(X_train, y_train)
    y_pred = model_cls.predict(X_test)
    y_prob = model_cls.predict_proba(X_test)[:, 1] if hasattr(model_cls, "predict_proba") else y_pred

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    try:
        auc = float(roc_auc_score(y_test, y_prob))
    except Exception:
        auc = 0.5

    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importance
    feat_imp = {}
    if hasattr(model_cls, "feature_importances_"):
        feat_imp = dict(zip(available_features, model_cls.feature_importances_.tolist()))
    elif hasattr(model_cls, "coef_"):
        feat_imp = dict(zip(available_features, np.abs(model_cls.coef_[0]).tolist()))

    results = {
        "confusion_matrix": cm,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "class_distribution": {"qualified": int(y.sum()), "not_qualified": int((y == 0).sum())},
        "model_type": model_type,
        "disclaimer": "Simulated experimental results for research purposes only."
    }

    return {
        "accuracy": acc,
        "precision_score": prec,
        "recall_score": rec,
        "f1_score": f1,
        "roc_auc": auc,
        "results_json": json.dumps(results),
        "feature_importance_json": json.dumps(feat_imp)
    }
