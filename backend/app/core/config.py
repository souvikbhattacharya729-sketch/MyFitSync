from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DEV_SECRET = "dev_secret_key_for_testing_purposes_only_32_chars!"


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    PROJECT_NAME: str = "MyFitSync"
    API_V1_STR: str = "/api/v1"

    # Database (PostgreSQL / Supabase)
    DATABASE_URL: Union[str, None] = None
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_NAME: str = Field(default="myfitsync")
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="postgres")
    DB_SSLMODE: str = Field(default="prefer")  # 'require' for Supabase, 'disable' / 'prefer' for local
    # Backward compatibility aliases
    APP_DB_USER: Union[str, None] = None
    APP_DB_PASSWORD: Union[str, None] = None

    # Connection pooling parameters (optimized for Supabase & local dev)
    DB_POOL_SIZE: int = Field(default=10)
    DB_MAX_OVERFLOW: int = Field(default=20)
    DB_POOL_RECYCLE_SECONDS: int = Field(default=300)
    DB_POOL_TIMEOUT_SECONDS: int = Field(default=30)

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
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,https://myfitsync.vercel.app,https://my-fit-sync.vercel.app"
    )
    ALLOWED_ORIGIN_REGEX: Union[str, None] = Field(default=r"^https://.*\.vercel\.app$")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def get_database_url(self) -> str:
        """
        Return a normalized PostgreSQL SQLAlchemy connection string.
        Automatically converts 'postgres://' or 'postgresql://' prefixes to 'postgresql+psycopg2://'
        for Supabase, Render, and standard cloud provider compatibility.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            if url.startswith("postgres://"):
                url = "postgresql+psycopg2://" + url[len("postgres://") :]
            elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
                url = "postgresql+psycopg2://" + url[len("postgresql://") :]

            if self.DB_SSLMODE == "require" and "sslmode" not in url:
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}sslmode=require"
            return url

        from urllib.parse import quote_plus

        user = self.DB_USER or self.APP_DB_USER or "postgres"
        password = self.DB_PASSWORD or self.APP_DB_PASSWORD or "postgres"
        safe_password = quote_plus(password)

        base_url = f"postgresql+psycopg2://{user}:{safe_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        if self.DB_SSLMODE and self.DB_SSLMODE != "disable":
            base_url = f"{base_url}?sslmode={self.DB_SSLMODE}"
        return base_url

    def validate_production_security(self):
        """Refuse to start in production with default secrets."""
        if self.ENVIRONMENT.lower() == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_DEV_SECRET or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: Refusing to start in production with default, "
                    "empty, or insufficiently long SECRET_KEY (minimum 32 characters required)."
                )
            effective_pwd = self.DB_PASSWORD or self.APP_DB_PASSWORD
            if not self.DATABASE_URL and effective_pwd in ("postgres", "AppP@ssw0rd2026!"):
                raise ValueError("FATAL: Cannot use default database password in production environment.")


settings = Settings()
