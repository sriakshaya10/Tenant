"""Evaluation metrics helpers."""
import numpy as np
from typing import Dict, Any


def compute_binary_metrics(y_true, y_pred, y_prob=None) -> Dict[str, float]:
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0))
    }
    if y_prob is not None:
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
        except Exception:
            metrics["roc_auc"] = 0.5
    return metrics
