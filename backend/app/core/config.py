from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./tenantsynth.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]
    MAX_RECORDS_LIMIT: int = 50000
    STORAGE_PATH: str = "../storage"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
