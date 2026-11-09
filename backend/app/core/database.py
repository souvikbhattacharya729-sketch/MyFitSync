from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

database_url = settings.get_database_url()

# Configure engine with pooling and pool_pre_ping
connect_args = {}
if "sqlite" in database_url:
    connect_args["check_same_thread"] = False

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=10 if "sqlite" not in database_url else 5,
    max_overflow=20 if "sqlite" not in database_url else 10,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
