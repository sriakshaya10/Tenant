import json
import uuid
from app.database.base import engine, Base, SessionLocal
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

PRESET_SCENARIOS = [
    {
        "name": "Stable Salaried Employment",
        "description": "Consistent full-time salaried income, established credit, and low debt ratio.",
        "scenario_type": "stable_salaried",
        "config": {
            "income_range": [4000, 15000],
            "rent_range": [1200, 3800],
            "credit_range": [680, 840],
            "employment_types": ["full-time"],
            "missing_value_pct": 0.02
        }
    },
    {
        "name": "Self-Employed Applicant",
        "description": "Business owner or contractor with higher income potential but variable cash flow.",
        "scenario_type": "self_employed",
        "config": {
            "income_range": [4500, 22000],
            "rent_range": [1500, 5000],
            "credit_range": [620, 800],
            "employment_types": ["self-employed"],
            "missing_value_pct": 0.04
        }
    },
    {
        "name": "Freelancer with Variable Income",
        "description": "Gig or creative professional with fluctuating monthly earnings and multiple clients.",
        "scenario_type": "freelancer",
        "config": {
            "income_range": [2500, 9000],
            "rent_range": [900, 2600],
            "credit_range": [600, 760],
            "employment_types": ["freelance"],
            "missing_value_pct": 0.06
        }
    },
    {
        "name": "First-Time Renter",
        "description": "Young professional or recent graduate with minimal previous rental history.",
        "scenario_type": "first_time_renter",
        "config": {
            "income_range": [2200, 5500],
            "rent_range": [800, 1800],
            "credit_range": [580, 710],
            "employment_types": ["full-time", "part-time"],
            "missing_value_pct": 0.08
        }
    },
    {
        "name": "Limited Credit History",
        "description": "Thin-file applicant with short credit length or alternative credit metrics.",
        "scenario_type": "limited_credit",
        "config": {
            "income_range": [2000, 6000],
            "rent_range": [700, 1800],
            "credit_range": [450, 620],
            "employment_types": ["full-time", "part-time", "freelance"],
            "missing_value_pct": 0.12
        }
    },
    {
        "name": "Long-Term Rental History",
        "description": "Established renter with extensive tenancy track record and strong references.",
        "scenario_type": "long_term_renter",
        "config": {
            "income_range": [3500, 12000],
            "rent_range": [1100, 3200],
            "credit_range": [660, 820],
            "employment_types": ["full-time", "self-employed"],
            "missing_value_pct": 0.03
        }
    },
    {
        "name": "Irregular Income Scenario",
        "description": "Seasonal or commission-based applicant with high variance across pay periods.",
        "scenario_type": "irregular_income",
        "config": {
            "income_range": [1800, 11000],
            "rent_range": [850, 2800],
            "credit_range": [560, 740],
            "employment_types": ["part-time", "freelance", "self-employed"],
            "missing_value_pct": 0.09
        }
    },
    {
        "name": "High Debt Scenario",
        "description": "Applicant with elevated student loans, auto debt, or medical debt commitments.",
        "scenario_type": "high_debt",
        "config": {
            "income_range": [3000, 10000],
            "rent_range": [1000, 2700],
            "credit_range": [540, 690],
            "employment_types": ["full-time", "part-time"],
            "missing_value_pct": 0.05
        }
    },
    {
        "name": "Missing Documentation Scenario",
        "description": "Incomplete application packet missing verification stubs, reference letters, or ID.",
        "scenario_type": "missing_docs",
        "config": {
            "income_range": [2000, 8000],
            "rent_range": [800, 2400],
            "credit_range": [520, 720],
            "employment_types": ["full-time", "part-time", "unemployed", "freelance"],
            "missing_value_pct": 0.22
        }
    },
    {
        "name": "Mixed Applicant Population",
        "description": "Representative cross-section of diverse applicants across all demographics and financial tiers.",
        "scenario_type": "mixed_population",
        "config": {
            "income_range": [1800, 16000],
            "rent_range": [600, 4500],
            "credit_range": [500, 830],
            "employment_types": ["full-time", "part-time", "self-employed", "freelance", "unemployed"],
            "missing_value_pct": 0.06
        }
    }
]


def init_db():
    # Import all models to register them
    from app.models import user, dataset, generation_job, scenario, model_experiment
    from app.models import quality_report, fairness_experiment, anomaly_experiment
    from app.models import drift_experiment, ai_report

    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

    db = SessionLocal()
    try:
        from app.models.scenario import ApplicantScenario
        existing = db.query(ApplicantScenario).filter(ApplicantScenario.is_preset == True).count()
        if existing == 0:
            for s in PRESET_SCENARIOS:
                scenario_obj = ApplicantScenario(
                    id=str(uuid.uuid4()),
                    user_id=None,
                    name=s["name"],
                    description=s["description"],
                    scenario_type=s["scenario_type"],
                    config_json=json.dumps(s["config"]),
                    is_preset=True
                )
                db.add(scenario_obj)
            db.commit()
            logger.info(f"Seeded {len(PRESET_SCENARIOS)} preset scenarios.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
