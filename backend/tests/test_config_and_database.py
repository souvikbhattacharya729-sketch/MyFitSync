import pytest

from app.core.config import Settings
from app.core.database import check_db_connection


def test_config_database_url_normalization():
    # 1. postgres:// URL normalization
    s1 = Settings(DATABASE_URL="postgres://user:pass@host:5432/db")
    assert s1.get_database_url() == "postgresql+psycopg2://user:pass@host:5432/db"

    # 2. postgresql:// URL normalization
    s2 = Settings(DATABASE_URL="postgresql://user:pass@host:5432/db")
    assert s2.get_database_url() == "postgresql+psycopg2://user:pass@host:5432/db"

    # 3. Supabase sslmode enforcement
    s3 = Settings(DATABASE_URL="postgresql://user:pass@host:5432/db", DB_SSLMODE="require")
    assert "sslmode=require" in s3.get_database_url()

    # 4. Construct from parts
    s4 = Settings(
        DATABASE_URL=None,
        DB_USER="custom_user",
        DB_PASSWORD="custom_pass",
        DB_HOST="custom_host",
        DB_PORT=5433,
        DB_NAME="custom_db",
        DB_SSLMODE="disable",
    )
    assert s4.get_database_url() == "postgresql+psycopg2://custom_user:custom_pass@custom_host:5433/custom_db"


def test_config_production_security_validation():
    # Production with short secret raises
    s_bad_secret = Settings(ENVIRONMENT="production", SECRET_KEY="short")
    with pytest.raises(ValueError, match="FATAL SECURITY VIOLATION"):
        s_bad_secret.validate_production_security()

    # Production with default dev secret raises
    s_default_secret = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="dev_secret_key_for_testing_purposes_only_32_chars!",
    )
    with pytest.raises(ValueError, match="FATAL SECURITY VIOLATION"):
        s_default_secret.validate_production_security()

    # Production with default db password raises
    s_default_db = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="super_secure_random_key_that_is_long_enough_for_prod!",
        DB_PASSWORD="postgres",
        DATABASE_URL=None,
    )
    with pytest.raises(ValueError, match="FATAL: Cannot use default database password"):
        s_default_db.validate_production_security()

    # Production with valid config passes
    s_valid = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="super_secure_random_key_that_is_long_enough_for_prod!",
        DATABASE_URL="postgresql://user:pass@aws-0-us-west.pooler.supabase.com:6543/postgres?sslmode=require",
    )
    s_valid.validate_production_security()


def test_check_db_connection_function():
    # In test runner environment, check_db_connection succeeds or handles error gracefully
    res = check_db_connection()
    assert isinstance(res, bool)
