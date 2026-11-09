import logging
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("myfitsync")
database_url = settings.get_database_url()

connect_args = {}
if "sqlite" in database_url:
    connect_args["check_same_thread"] = False
else:
    # 10s connection timeout for PostgreSQL / Supabase
    connect_args["connect_timeout"] = 10

is_sqlite = "sqlite" in database_url

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE if not is_sqlite else 5,
    max_overflow=settings.DB_MAX_OVERFLOW if not is_sqlite else 10,
    pool_recycle=settings.DB_POOL_RECYCLE_SECONDS if not is_sqlite else -1,
    pool_timeout=settings.DB_POOL_TIMEOUT_SECONDS if not is_sqlite else 30,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def check_db_connection() -> bool:
    """Verifies active connectivity to the PostgreSQL / Supabase database."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        return False


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a sync database session.
    Guarantees transaction-per-request semantics (auto-commit on success, auto-rollback on error).
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
