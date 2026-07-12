from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field, AliasChoices
import secrets


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    PROJECT_NAME: str = "TransitOps"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Set DATABASE_URL env var to override. Defaults to SQLite for local dev.
    DATABASE_URL: str = "sqlite+aiosqlite:///./transitops.db"

    # PostgreSQL settings (used only if DATABASE_URL is not set or is PostgreSQL)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "transitops"
    POSTGRES_PASSWORD: str = "transitops_secret"
    POSTGRES_DB: str = "transitops"

    @property
    def EFFECTIVE_DATABASE_URL(self) -> str:
        """Returns the database URL to use.
        If DATABASE_URL is explicitly set, use it.
        Otherwise default to SQLite for easy local development.
        """
        return self.DATABASE_URL

    @property
    def IS_SQLITE(self) -> bool:
        """Check if we're using SQLite (for pool configuration)."""
        return "sqlite" in self.DATABASE_URL

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Synchronous version for Alembic migrations."""
        url = self.DATABASE_URL
        if "sqlite+aiosqlite" in url:
            return url.replace("sqlite+aiosqlite", "sqlite")
        if "postgresql+asyncpg" in url:
            return url.replace("postgresql+asyncpg", "postgresql")
        return url

    # Redis (optional — gracefully degrade if not available)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_ENABLED: bool = False  # Set True when Redis is available

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8069",
            "http://localhost:8080",
        ],
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "CORS_ORIGINS"),
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 10

    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()
