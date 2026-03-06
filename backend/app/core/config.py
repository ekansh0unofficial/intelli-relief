from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache


class Settings(BaseSettings):

    # ============================================
    # APP
    # ============================================
    APP_NAME: str = "IntelliRelief API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ============================================
    # DATABASE
    # ============================================
    DATABASE_URL: str = "postgresql+asyncpg://intelli_relief:intelli_relief_dev_2026@localhost:5432/intelli_relief_db"
    SQL_ECHO: bool = False

    # ============================================
    # REDIS
    # ============================================
    REDIS_URL: str = "redis://localhost:6379/0"

    # ============================================
    # JWT / AUTH
    # ============================================
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ============================================
    # CORS
    # ============================================
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:80"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ============================================
    # EXTERNAL APIs
    # ============================================
    OPENWEATHER_API_KEY: str = ""

    # ============================================
    # LOGGING
    # ============================================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/logs/intelli-relief.log"

    # ============================================
    # SECURITY
    # ============================================
    RATE_LIMIT_PER_MINUTE: int = 60
    MIN_PASSWORD_LENGTH: int = 8
    SESSION_TIMEOUT_MINUTES: int = 30

    # FIX: replaced deprecated Pydantic v1 `class Config` with the v2
    # `model_config = SettingsConfigDict(...)` API.  The old form still
    # works via a compatibility shim in pydantic-settings but emits
    # deprecation warnings and will be removed in a future version.
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    # FIX: added SECRET_KEY validation — an empty SECRET_KEY means every
    # JWT ever issued would be signed with an empty string, making tokens
    # trivially forgeable.  Fail fast at startup rather than silently
    # accepting a catastrophic misconfiguration.
    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError(
                "SECRET_KEY must be set in .env — "
                "an empty key makes all JWTs insecure."
            )
        return v


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use as a FastAPI dependency: Depends(get_settings)
    """
    return Settings()


settings = get_settings()