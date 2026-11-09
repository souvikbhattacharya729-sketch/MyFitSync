import os
import sys

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User

# In-memory SQLite for rapid unit and API testing
SQLITE_TEST_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
            db_session.commit()
        except HTTPException:
            # HTTPException is a normal API response, commit any valid state
            db_session.commit()
            raise
        except Exception:
            db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_a(db_session) -> User:
    user = User(
        user_id="user-a-1111-1111-111111111111",
        email="user_a@example.com",
        hashed_password=get_password_hash("Password123!@#"),
        name="Alice Walker",
        bodyweight_kg=68.0,
        target_calories=2200,
        target_protein_g=140.0,
        target_carbs_g=220.0,
        target_fat_g=60.0,
        timezone="UTC",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_b(db_session) -> User:
    user = User(
        user_id="user-b-2222-2222-222222222222",
        email="user_b@example.com",
        hashed_password=get_password_hash("Password123!@#"),
        name="Bob Builder",
        bodyweight_kg=85.0,
        target_calories=2800,
        target_protein_g=180.0,
        target_carbs_g=280.0,
        target_fat_g=80.0,
        timezone="UTC",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_user_a(test_user_a) -> dict:
    token = create_access_token(test_user_a.user_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_b(test_user_b) -> dict:
    token = create_access_token(test_user_b.user_id)
    return {"Authorization": f"Bearer {token}"}
