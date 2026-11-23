# TenantSynth AI

**Synthetic Rental Application Data Generator & Research Platform**

> ⚠️ **Research & Testing Only**: All data is entirely fictional. Not for use in actual tenant screening.

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at http://localhost:8000
Swagger docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173

## Features

- **Data Generation**: Faker (baseline), Gaussian Copula, CTGAN
- **Quality Analysis**: Statistical validation against reference distributions
- **Screening Simulator**: ML model training (research only)
- **Fairness Analysis**: Group-level fairness metrics
- **Report Generator**: AI-powered (Gemini/OpenAI) or template reports
- **Data Laboratory**: Interactive data exploration

## Configuration

Copy `.env.example` to `backend/.env` and set:
- `GEMINI_API_KEY`: For AI-powered reports
- `OPENAI_API_KEY`: OpenAI fallback
- `SECRET_KEY`: Change in production

## Architecture

- **Backend**: FastAPI + SQLAlchemy + SQLite + Pydantic v2
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **ML**: scikit-learn + SDV + scipy
