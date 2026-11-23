from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional


class BaseGenerator(ABC):
    def __init__(self, seed: Optional[int] = None):
        self.seed = seed
        if seed is not None:
            np.random.seed(seed)

    @abstractmethod
    def generate(self, config: Dict[str, Any]) -> pd.DataFrame:
        pass

    def _apply_missing_values(self, df: pd.DataFrame, missing_pct: float, exclude_cols: list = None) -> pd.DataFrame:
        if missing_pct <= 0:
            return df
        exclude_cols = exclude_cols or ["applicant_id", "application_date"]
        eligible_cols = [c for c in df.columns if c not in exclude_cols]
        for col in eligible_cols:
            mask = np.random.random(len(df)) < missing_pct
            df.loc[mask, col] = None
        return df
