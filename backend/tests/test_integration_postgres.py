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


# Integration test against real PostgreSQL / Supabase instance
def get_postgres_test_url():
    if os.getenv("TEST_DATABASE_URL"):
        return os.getenv("TEST_DATABASE_URL")

    import urllib.parse

    host = os.getenv("TEST_DB_HOST", settings.DB_HOST)
    port = os.getenv("TEST_DB_PORT", str(settings.DB_PORT))
    user = os.getenv("TEST_DB_USER", settings.DB_USER or "postgres")
    pwd = os.getenv("TEST_DB_PASSWORD", settings.DB_PASSWORD or "postgres")
    safe_pwd = urllib.parse.quote_plus(pwd)
    dbname = os.getenv("TEST_DB_NAME", settings.DB_NAME)
    sslmode = os.getenv("TEST_DB_SSLMODE", settings.DB_SSLMODE)

    base_url = f"postgresql+psycopg2://{user}:{safe_pwd}@{host}:{port}/{dbname}"
    if sslmode and sslmode != "disable":
        base_url = f"{base_url}?sslmode={sslmode}"
    return base_url


@pytest.fixture(scope="module")
def postgres_engine():
    url = get_postgres_test_url()
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine
    except Exception as exc:
        pytest.skip(f"PostgreSQL instance not reachable directly for integration tests: {exc}")


@pytest.fixture
def postgres_session(postgres_engine):
    Session = sessionmaker(bind=postgres_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


def test_postgres_connectivity_and_tables(postgres_session):
    result = postgres_session.execute(
        text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='public' AND TABLE_TYPE='BASE TABLE'")
    ).fetchall()
    table_names = [r[0] for r in result]
    for expected in ["users", "workouts", "nutrition", "daily_readiness"]:
        assert expected in table_names, f"Expected table '{expected}' in {table_names}"


def test_postgres_check_constraints_enforced(postgres_session):
    # Test check constraint on workouts: reps > 0
    test_user = User(
        user_id="test-postgres-user-1",
        email="test_postgres_constraint@example.com",
        hashed_password=get_password_hash("ValidPass123!"),
        name="Postgres Integration Tester",
        bodyweight_kg=75.0,
        target_calories=2500,
        timezone="UTC",
    )
    postgres_session.merge(test_user)
    postgres_session.commit()

    # Attempt inserting invalid reps (0)
    invalid_workout = Workout(
        user_id=test_user.user_id,
        exercise="squat",
        exercise_raw="Squat",
        weight_kg=100.0,
        reps=0,  # Violated: chk_workout_reps_positive
        sets=3,
        total_volume=0.0,
        performed_on=date.today(),
    )
    postgres_session.add(invalid_workout)
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()

    # Attempt inserting negative weight (-50)
    invalid_weight = Workout(
        user_id=test_user.user_id,
        exercise="squat",
        exercise_raw="Squat",
        weight_kg=-50.0,  # Violated: chk_workout_weight_nonneg
        reps=5,
        sets=3,
        total_volume=0.0,
        performed_on=date.today(),
    )
    postgres_session.add(invalid_weight)
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()


def test_postgres_cascade_delete(postgres_session):
    # Test ON DELETE CASCADE
    test_user = User(
        user_id="test-postgres-cascade-user",
        email="test_postgres_cascade@example.com",
        hashed_password=get_password_hash("ValidPass123!"),
        name="Cascade Tester",
        bodyweight_kg=80.0,
        target_calories=2500,
        timezone="UTC",
    )
    postgres_session.merge(test_user)
    postgres_session.commit()

    test_workout = Workout(
        user_id=test_user.user_id,
        exercise="bench_press",
        exercise_raw="Bench Press",
        weight_kg=80.0,
        reps=5,
        sets=3,
        total_volume=1200.0,
        performed_on=date.today(),
    )
    postgres_session.add(test_workout)
    postgres_session.commit()
    workout_id = test_workout.id

    # Deleting user must cascade and delete associated workout in real PostgreSQL
    user_to_delete = postgres_session.query(User).filter_by(user_id=test_user.user_id).first()
    postgres_session.delete(user_to_delete)
    postgres_session.commit()

    # Query for the child workout
    remaining_workout = postgres_session.query(Workout).filter_by(id=workout_id).first()
    assert remaining_workout is None, "Child workout was not deleted by ON DELETE CASCADE"
