"""
Faker-based synthetic rental applicant data generator.
Generates realistic FICTIONAL data - all records are completely synthetic.
"""
import numpy as np
import pandas as pd
from faker import Faker
from typing import Dict, Any, Optional, List
from app.generators.base import BaseGenerator

fake = Faker()


class FakerGenerator(BaseGenerator):
    """Generate synthetic rental application data using Faker + NumPy."""

    def generate(self, config: Dict[str, Any]) -> pd.DataFrame:
        n = config.get("record_count", 1000)
        seed = config.get("seed", self.seed)
        if seed is not None:
            import random
            np.random.seed(seed)
            random.seed(seed)
            Faker.seed(seed)
            fake.seed_instance(seed)

        income_min = config.get("income_min") or 1500
        income_max = config.get("income_max") or 15000
        rent_min = config.get("rent_min") or 400
        rent_max = config.get("rent_max") or 4000
        credit_min = config.get("credit_min") or 300
        credit_max = config.get("credit_max") or 850
        emp_types = config.get("employment_types") or ["full-time", "part-time", "self-employed", "freelance", "unemployed"]
        missing_pct = config.get("missing_value_pct") if config.get("missing_value_pct") is not None else 0.05
        scenario = config.get("rental_market_scenario") or "standard"

        # Adjust probabilities based on employment types available
        emp_weights = self._get_emp_weights(emp_types)

        records = []
        for i in range(n):
            emp_type = np.random.choice(emp_types, p=emp_weights)

            # Income based on employment type and config range
            income = self._generate_income(emp_type, income_min, income_max)

            # Rent: 20-40% of income, clamped to config range
            rent_pct = np.random.uniform(0.20, 0.42)
            rent = np.clip(income * rent_pct, rent_min, rent_max)

            # Credit score
            credit_score = int(np.clip(
                np.random.normal((credit_min + credit_max) / 2, (credit_max - credit_min) / 6),
                credit_min, credit_max
            ))

            # Employment duration
            emp_duration = self._get_emp_duration(emp_type)

            # Savings: positively correlated with income
            savings = max(0, income * np.random.uniform(0.5, 5) + np.random.normal(0, 500))

            # Debt
            existing_debt = max(0, income * np.random.uniform(0, 0.35))
            dti = round(existing_debt / income, 3) if income > 0 else 0

            # Payment history correlated with credit score
            base_payment = (credit_score - credit_min) / max(credit_max - credit_min, 1) * 100
            payment_score = float(np.clip(base_payment + np.random.normal(0, 8), 0, 100))

            # Employment stability (higher for full-time, lower for unemployed)
            stability = self._get_stability(emp_type)

            # Income variability (higher for freelance/self-employed)
            variability = self._get_variability(emp_type)

            # Household
            household_size = int(np.random.choice([1, 2, 3, 4, 5], p=[0.30, 0.35, 0.20, 0.10, 0.05]))
            num_dependents = int(np.random.randint(0, min(household_size, 3)))

            # Rental experience
            rental_exp = max(0, np.random.exponential(5))
            prev_duration = int(np.clip(np.random.exponential(24), 0, 120))
            prev_rent_score = float(np.clip(np.random.normal(75, 20), 0, 100))

            records.append({
                "applicant_id": f"SYNTH-{i+1:06d}",
                "application_date": fake.date_between(start_date="-1y", end_date="today").isoformat(),
                "application_completeness": round(float(np.random.uniform(0.6, 1.0)), 2),
                "rental_market_scenario": scenario,
                "monthly_income": round(float(income), 2),
                "monthly_rent": round(float(rent), 2),
                "rent_to_income_ratio": round(float(rent / income), 3) if income > 0 else 0,
                "savings": round(float(savings), 2),
                "existing_monthly_debt": round(float(existing_debt), 2),
                "debt_to_income_ratio": dti,
                "employment_type": emp_type,
                "employment_duration_months": emp_duration,
                "employment_stability": round(float(stability), 2),
                "income_variability": round(float(variability), 2),
                "credit_score": credit_score,
                "credit_history_length_months": int(np.clip(np.random.exponential(48), 0, 360)),
                "has_credit_history": int(credit_score > 350),
                "payment_history_score": round(float(payment_score), 2),
                "prev_rental_duration_months": prev_duration,
                "prev_rent_payment_score": round(float(prev_rent_score), 2),
                "has_rental_reference": int(np.random.random() > 0.3),
                "rental_experience_years": round(float(rental_exp), 1),
                "household_size": household_size,
                "num_dependents": num_dependents,
                "desired_property_type": np.random.choice(["apartment", "house", "studio", "condo", "townhouse"]),
                "preferred_lease_months": int(np.random.choice([6, 12, 18, 24])),
                "has_all_documents": int(np.random.random() > 0.15),
                "num_references": int(np.random.choice([0, 1, 2, 3]))
            })

        df = pd.DataFrame(records)
        if missing_pct and missing_pct > 0:
            df = self._apply_missing_values(df, missing_pct)
        return df

    def _get_emp_weights(self, emp_types: List[str]) -> List[float]:
        base = {
            "full-time": 0.55, "part-time": 0.15, "self-employed": 0.15,
            "freelance": 0.10, "unemployed": 0.05
        }
        weights = [base.get(e, 0.1) for e in emp_types]
        total = sum(weights)
        return [w / total for w in weights]

    def _generate_income(self, emp_type: str, income_min: float, income_max: float) -> float:
        center = (income_min + income_max) / 2
        std = (income_max - income_min) / 6
        multipliers = {
            "full-time": 1.0, "self-employed": 1.1,
            "part-time": 0.5, "freelance": 0.75, "unemployed": 0.25
        }
        raw = np.random.normal(center * multipliers.get(emp_type, 1.0), std)
        return float(np.clip(raw, income_min * 0.5, income_max * 1.5))

    def _get_emp_duration(self, emp_type: str) -> int:
        if emp_type == "unemployed":
            return int(np.random.uniform(0, 6))
        return int(np.clip(np.random.exponential(36), 1, 240))

    def _get_stability(self, emp_type: str) -> float:
        mapping = {
            "full-time": np.random.uniform(0.7, 1.0),
            "part-time": np.random.uniform(0.4, 0.75),
            "self-employed": np.random.uniform(0.4, 0.85),
            "freelance": np.random.uniform(0.3, 0.70),
            "unemployed": np.random.uniform(0.0, 0.3)
        }
        return float(mapping.get(emp_type, np.random.uniform(0.3, 0.8)))

    def _get_variability(self, emp_type: str) -> float:
        mapping = {
            "full-time": np.random.uniform(0.0, 0.08),
            "part-time": np.random.uniform(0.05, 0.20),
            "self-employed": np.random.uniform(0.10, 0.45),
            "freelance": np.random.uniform(0.15, 0.50),
            "unemployed": np.random.uniform(0.0, 0.05)
        }
        return float(mapping.get(emp_type, np.random.uniform(0.05, 0.25)))
