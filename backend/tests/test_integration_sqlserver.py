import os
from datetime import date

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.workout import Workout


# Integration test against real SQL Server instance
def get_sqlserver_test_url():
    import urllib.parse

    host = os.getenv("TEST_DB_HOST", settings.DB_HOST)
    port = os.getenv("TEST_DB_PORT", str(settings.DB_PORT))
    user = os.getenv("TEST_DB_USER", settings.APP_DB_USER)
    pwd = os.getenv("TEST_DB_PASSWORD", settings.APP_DB_PASSWORD)
    safe_pwd = urllib.parse.quote_plus(pwd)
    dbname = os.getenv("TEST_DB_NAME", settings.DB_NAME)
    return (
        f"mssql+pyodbc://{user}:{safe_pwd}@{host}:{port}/{dbname}"
        "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Connection+Timeout=5"
    )


@pytest.fixture(scope="module")
def sqlserver_engine():
    url = get_sqlserver_test_url()
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine
    except Exception as exc:
        pytest.skip(f"SQL Server instance not reachable directly for integration tests: {exc}")


@pytest.fixture
def sqlserver_session(sqlserver_engine):
    Session = sessionmaker(bind=sqlserver_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


def test_sqlserver_connectivity_and_tables(sqlserver_session):
    result = sqlserver_session.execute(
        text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'")
    ).fetchall()
    table_names = [r[0] for r in result]
    for expected in ["users", "workouts", "nutrition", "daily_readiness"]:
        assert expected in table_names


def test_sqlserver_check_constraints_enforced(sqlserver_session):
    # Test check constraint on workouts: reps > 0
    test_user = User(
        user_id="test-sqlserver-user-1",
        email="test_sqlserver@example.com",
        hashed_password=get_password_hash("ValidPass123!"),
        name="Integration Tester",
        bodyweight_kg=75.0,
        target_calories=2500,
        timezone="UTC",
    )
    sqlserver_session.merge(test_user)
    sqlserver_session.commit()

    # Attempt inserting invalid reps (0)
    invalid_workout = Workout(
        user_id=test_user.user_id,
        exercise="squat",
        exercise_raw="Squat",
        weight_kg=100.0,
        reps=0,  # Violates chk_workout_reps_positive
        sets=3,
        total_volume=0.0,
        performed_on=date.today(),
    )
    sqlserver_session.add(invalid_workout)
    with pytest.raises(IntegrityError):
        sqlserver_session.commit()
    sqlserver_session.rollback()


def test_sqlserver_cascade_delete(sqlserver_session):
    test_user = User(
        user_id="test-cascade-user",
        email="cascade_user@example.com",
        hashed_password=get_password_hash("ValidPass123!"),
        name="Cascade Tester",
        bodyweight_kg=75.0,
        target_calories=2500,
        timezone="UTC",
    )
    # Clear existing if any
    existing = sqlserver_session.query(User).filter_by(user_id="test-cascade-user").first()
    if existing:
        sqlserver_session.delete(existing)
        sqlserver_session.commit()

    sqlserver_session.add(test_user)
    sqlserver_session.commit()

    workout = Workout(
        user_id="test-cascade-user",
        exercise="bench_press",
        exercise_raw="Bench",
        weight_kg=80.0,
        reps=5,
        sets=3,
        total_volume=1200.0,
        performed_on=date.today(),
    )
    sqlserver_session.add(workout)
    sqlserver_session.commit()

    # Deleting user must cascade and delete associated workout in real SQL Server
    user_to_delete = sqlserver_session.query(User).filter_by(user_id="test-cascade-user").first()
    sqlserver_session.delete(user_to_delete)
    sqlserver_session.commit()

    orphaned = sqlserver_session.query(Workout).filter(Workout.user_id == "test-cascade-user").all()
    assert len(orphaned) == 0
