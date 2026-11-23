"""
AI-powered report generator.
Tries Gemini API first, then OpenAI fallback, then template fallback.
"""
import json
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def generate_report(dataset_info: Dict[str, Any], quality_metrics: Dict[str, Any],
                    api_key: str = "", gemini_key: str = "", report_type: str = "comprehensive") -> Dict[str, str]:
    """Generate a markdown report from dataset metrics."""
    # Try Gemini first
    if gemini_key:
        try:
            return _gemini_report(dataset_info, quality_metrics, gemini_key, report_type)
        except Exception as e:
            logger.warning(f"Gemini report failed: {e}")

    # Try OpenAI
    if api_key:
        try:
            return _openai_report(dataset_info, quality_metrics, api_key, report_type)
        except Exception as e:
            logger.warning(f"OpenAI report failed: {e}")

    # Template fallback
    return _template_report(dataset_info, quality_metrics, report_type)


def _gemini_report(dataset_info: Dict, quality_metrics: Dict, api_key: str, report_type: str) -> Dict[str, str]:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = _build_prompt(dataset_info, quality_metrics, report_type)
    response = model.generate_content(prompt)
    return {"content": response.text, "model_used": "gemini-1.5-flash"}


def _openai_report(dataset_info: Dict, quality_metrics: Dict, api_key: str, report_type: str) -> Dict[str, str]:
    import httpx
    prompt = _build_prompt(dataset_info, quality_metrics, report_type)
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1500
    }
    with httpx.Client(timeout=30) as client:
        resp = client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
    return {"content": content, "model_used": "gpt-3.5-turbo"}


def _build_prompt(dataset_info: Dict, quality_metrics: Dict, report_type: str) -> str:
    return f"""Generate a comprehensive data quality report for a synthetic rental applicant dataset.

Dataset Info:
{json.dumps(dataset_info, indent=2)}

Quality Metrics:
- Overall Score: {quality_metrics.get('overall_score', 'N/A')}
- Warnings: {quality_metrics.get('warnings_json', '[]')}

Write a professional markdown report covering:
1. Executive Summary
2. Dataset Overview
3. Generation Technique Analysis
4. Data Quality Findings
5. Distribution Analysis
6. Recommendations for Use
7. Limitations and Disclaimers

Format as clean markdown. Keep it professional and research-oriented."""


def _template_report(dataset_info: Dict, quality_metrics: Dict, report_type: str) -> Dict[str, str]:
    name = dataset_info.get("name", "Synthetic Dataset")
    record_count = dataset_info.get("record_count", 0)
    method = dataset_info.get("generation_method", "faker")
    overall_score = quality_metrics.get("overall_score", 0)
    warnings = json.loads(quality_metrics.get("warnings_json", "[]"))
    created_at = dataset_info.get("created_at", "N/A")

    warnings_md = "\n".join([f"- ⚠️ {w}" for w in warnings]) if warnings else "- ✅ No significant warnings detected"

    content = f"""# TenantSynth AI Data Quality Report

## {name}

**Generated:** {created_at}  
**Records:** {record_count:,}  
**Generation Method:** {method.replace("_", " ").title()}  
**Overall Quality Score:** {overall_score:.1f}/100

---

## Executive Summary

This report analyzes the synthetic rental applicant dataset **{name}**, generated using the **{method}** method.
The dataset contains {record_count:,} fictional records for use in rental screening model research and testing.

**Quality Assessment:** {"✅ Good" if overall_score >= 75 else "⚠️ Moderate" if overall_score >= 50 else "❌ Poor"} ({overall_score:.1f}/100)

---

## Dataset Overview

| Property | Value |
|----------|-------|
| Dataset Name | {name} |
| Record Count | {record_count:,} |
| Generation Method | {method} |
| Quality Score | {overall_score:.1f}/100 |

---

## Generation Technique Analysis

### Method: {method.replace("_", " ").title()}

{"**Faker (Baseline):** Uses rule-based generation with Faker library and NumPy. Creates realistic fictional data with configurable correlations. Best for quick iteration and baseline testing." if method == "faker" else ""}
{"**Gaussian Copula:** Uses SDV's GaussianCopulaSynthesizer trained on a fictional reference dataset. Captures statistical correlations and marginal distributions from the reference data." if method == "gaussian_copula" else ""}
{"**CTGAN:** Uses Conditional Tabular GAN architecture via SDV. Trained on a fictional reference dataset to learn complex multi-modal distributions." if method == "ctgan" else ""}

---

## Data Quality Findings

### Quality Warnings

{warnings_md}

### Key Metrics

The dataset was evaluated against the following quality dimensions:

- **Distribution Fidelity:** Comparison of generated vs. reference distributions using KS statistics
- **Constraint Satisfaction:** Business rule validation (income/rent ratios, household constraints)
- **Missing Value Rates:** Analysis of null/missing data patterns
- **Duplicate Detection:** Identification of duplicate or near-duplicate records
- **Correlation Preservation:** Assessment of inter-column correlation structure

---

## Recommendations for Use

1. **Model Testing:** This dataset is suitable for testing rental screening model pipelines
2. **Fairness Auditing:** Use the fairness analysis tools to check for proxy discrimination
3. **Anomaly Detection:** Inject anomalies using the laboratory tools to test detection systems
4. **Distribution Drift:** Use drift simulation to test model robustness over time

---

## Limitations and Disclaimers

> **⚠️ IMPORTANT:** This dataset contains entirely fictional data generated for research and testing purposes only.
> 
> - All applicant records are synthetic and do not represent real individuals
> - This tool is NOT intended for use in actual tenant screening decisions
> - The screening simulation results are experimental and not for production use
> - Fairness metrics are approximations for research purposes only

---

*Report generated by TenantSynth AI - Synthetic Data Platform*
"""
    return {"content": content, "model_used": "template"}
