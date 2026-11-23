"""
SDV Gaussian Copula Synthesizer for rental applicant data.
Uses SDV's GaussianCopulaSynthesizer trained on fictional reference data.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from app.generators.base import BaseGenerator
from app.generators.reference_data import build_reference_data
import logging

logger = logging.getLogger(__name__)


class GaussianCopulaGenerator(BaseGenerator):
    """Generate synthetic data using SDV GaussianCopulaSynthesizer."""

    def generate(self, config: Dict[str, Any]) -> pd.DataFrame:
        n = config.get("record_count", 1000)
        seed = config.get("seed", self.seed)
        missing_pct = config.get("missing_value_pct", 0.05)

        try:
            from sdv.single_table import GaussianCopulaSynthesizer
            from sdv.metadata import SingleTableMetadata

            # Build reference data
            ref_df = build_reference_data(n=500, seed=seed)
            # Drop non-numeric columns that cause issues
            numeric_ref = ref_df.drop(columns=["applicant_id", "application_date", "rental_market_scenario",
                                                "employment_type", "desired_property_type"], errors="ignore")

            metadata = SingleTableMetadata()
            metadata.detect_from_dataframe(numeric_ref)

            synthesizer = GaussianCopulaSynthesizer(metadata)
            synthesizer.fit(numeric_ref)

            if seed is not None:
                synthetic = synthesizer.sample(num_rows=n, batch_size=min(n, 1000))
            else:
                synthetic = synthesizer.sample(num_rows=n)

            # Post-process: add categorical columns back
            synthetic = self._post_process(synthetic, config, n, seed)

            if missing_pct and missing_pct > 0:
                synthetic = self._apply_missing_values(synthetic, missing_pct)

            return synthetic

        except Exception as e:
            logger.warning(f"GaussianCopula failed ({e}), falling back to Faker")
            from app.generators.faker_generator import FakerGenerator
            return FakerGenerator(seed=seed).generate(config)

    def _post_process(self, df: pd.DataFrame, config: Dict, n: int, seed: Optional[int]) -> pd.DataFrame:
        if seed is not None:
            np.random.seed(seed)
        emp_types = config.get("employment_types") or ["full-time", "part-time", "self-employed", "freelance", "unemployed"]
        df["applicant_id"] = [f"GC-{i+1:06d}" for i in range(len(df))]
        df["employment_type"] = np.random.choice(emp_types, size=len(df))
        df["rental_market_scenario"] = config.get("rental_market_scenario", "standard")
        df["desired_property_type"] = np.random.choice(["apartment", "house", "studio", "condo", "townhouse"], size=len(df))
        df["application_date"] = pd.date_range(end=pd.Timestamp.today(), periods=len(df), freq="h").strftime("%Y-%m-%d").tolist()
        # Clip numeric columns to valid ranges
        if "credit_score" in df.columns:
            df["credit_score"] = df["credit_score"].clip(300, 850).round().astype(int)
        if "monthly_income" in df.columns:
            df["monthly_income"] = df["monthly_income"].clip(500, 100000).round(2)
        return df
