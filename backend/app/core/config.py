import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DEV_SECRET = "dev_secret_key_for_testing_purposes_only_32_chars!"

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    PROJECT_NAME: str = "MyFitSync"
    API_V1_STR: str = "/api/v1"

    # Database
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=1433)
    DB_NAME: str = Field(default="MyFitSyncDB")
    APP_DB_USER: str = Field(default="myfitsync_app")
    APP_DB_PASSWORD: str = Field(default="AppP@ssw0rd2026!")
    MSSQL_SA_PASSWORD: str = Field(default="Str0ngPassw0rd2026!")
    DATABASE_URL: Union[str, None] = None

    # Security
    SECRET_KEY: str = Field(default=DEFAULT_DEV_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MAX_REQUEST_BODY_SIZE_BYTES: int = 1024 * 1024  # 1 MB

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # PyODBC connection string for Microsoft SQL Server with safe escaping
        from urllib.parse import quote_plus
        safe_password = quote_plus(self.APP_DB_PASSWORD)
        return (
            f"mssql+pyodbc://{self.APP_DB_USER}:{safe_password}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Connection+Timeout=30"
        )

    def validate_production_security(self):
        """Refuse to start in production with default secrets."""
        if self.ENVIRONMENT.lower() == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_DEV_SECRET or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: Refusing to start in production with default, "
                    "empty, or insufficiently long SECRET_KEY (minimum 32 characters required)."
                )
            if self.APP_DB_PASSWORD == "AppP@ssw0rd2026!":
                raise ValueError("FATAL: Cannot use default database password in production environment.")

settings = Settings()
