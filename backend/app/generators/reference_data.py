"""
Reference data builder for SDV-based generators.
Generates a realistic FICTIONAL dataset of 500 records using Faker + NumPy.
All data is completely synthetic and fictional - not based on real individuals.
"""
import numpy as np
import pandas as pd
from faker import Faker
from typing import Optional

fake = Faker()


def build_reference_data(n: int = 500, seed: Optional[int] = 42) -> pd.DataFrame:
    """Build a fictional reference dataset for training SDV synthesizers."""
    if seed is not None:
        np.random.seed(seed)
        Faker.seed(seed)

    records = []
    for i in range(n):
        # Employment type
        emp_type = np.random.choice(
            ["full-time", "part-time", "self-employed", "freelance", "unemployed"],
            p=[0.55, 0.15, 0.15, 0.10, 0.05]
        )

        # Income based on employment type
        if emp_type == "full-time":
            income = max(2000, np.random.normal(5500, 2000))
        elif emp_type == "part-time":
            income = max(800, np.random.normal(2500, 800))
        elif emp_type == "self-employed":
            income = max(1500, np.random.normal(6000, 3000))
        elif emp_type == "freelance":
            income = max(1000, np.random.normal(4000, 2500))
        else:
            income = max(500, np.random.normal(1500, 500))

        # Rent is 20-40% of income
        rent_pct = np.random.uniform(0.20, 0.40)
        rent = income * rent_pct

        # Credit score
        credit_score = int(np.clip(np.random.normal(680, 80), 300, 850))

        # Employment duration
        if emp_type == "unemployed":
            emp_duration = int(np.random.uniform(0, 3))
        else:
            emp_duration = int(np.clip(np.random.exponential(36), 1, 240))

        # Savings correlated with income
        savings = max(0, income * np.random.uniform(0.5, 6) + np.random.normal(0, 1000))

        # Debt
        existing_debt = max(0, income * np.random.uniform(0, 0.3))
        dti = existing_debt / income if income > 0 else 0

        # Payment history (correlated with credit score)
        payment_score = np.clip((credit_score - 300) / 550 * 100 + np.random.normal(0, 10), 0, 100)

        # Household
        household_size = int(np.random.choice([1, 2, 3, 4, 5], p=[0.30, 0.35, 0.20, 0.10, 0.05]))
        num_dependents = int(np.random.randint(0, min(household_size, 3)))

        # Rental experience
        rental_exp = np.random.uniform(0, 15)
        prev_duration = int(np.clip(np.random.exponential(24), 0, 120))
        prev_rent_score = np.clip(np.random.normal(75, 20), 0, 100)

        records.append({
            "applicant_id": f"FAKE-{i+1:05d}",
            "application_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
            "application_completeness": round(np.random.uniform(0.7, 1.0), 2),
            "rental_market_scenario": np.random.choice(["standard", "high_cost", "affordable", "luxury", "student", "gig_economy"]),
            "monthly_income": round(income, 2),
            "monthly_rent": round(rent, 2),
            "rent_to_income_ratio": round(rent / income, 3) if income > 0 else 0,
            "savings": round(savings, 2),
            "existing_monthly_debt": round(existing_debt, 2),
            "debt_to_income_ratio": round(dti, 3),
            "employment_type": emp_type,
            "employment_duration_months": emp_duration,
            "employment_stability": round(np.random.uniform(0, 1), 2),
            "income_variability": round(np.random.uniform(0, 0.5) if emp_type in ["freelance", "self-employed"] else np.random.uniform(0, 0.1), 2),
            "credit_score": credit_score,
            "credit_history_length_months": int(np.clip(np.random.exponential(48), 0, 360)),
            "has_credit_history": int(credit_score > 350),
            "payment_history_score": round(payment_score, 2),
            "prev_rental_duration_months": prev_duration,
            "prev_rent_payment_score": round(prev_rent_score, 2),
            "has_rental_reference": int(np.random.random() > 0.3),
            "rental_experience_years": round(rental_exp, 1),
            "household_size": household_size,
            "num_dependents": num_dependents,
            "desired_property_type": np.random.choice(["apartment", "house", "studio", "condo", "townhouse"]),
            "preferred_lease_months": int(np.random.choice([6, 12, 18, 24])),
            "has_all_documents": int(np.random.random() > 0.15),
            "num_references": int(np.random.choice([0, 1, 2, 3]))
        })

    return pd.DataFrame(records)
