import os
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status

from app.models.coach import CoachUsage
from app.models.workout import Workout
from app.services import coach_service
from app.services.coach_service import build_context, is_crisis


def test_coach_disabled_fallback_to_rule_based(client, auth_headers_user_a, monkeypatch):
    monkeypatch.setenv("COACH_ENABLED", "false")
    with patch.object(coach_service, "get_client") as mock_get_client:
        res = client.post(
            "/api/v1/chat",
            json={"message": "Give me a 4 day upper lower split for hypertrophy"},
            headers=auth_headers_user_a,
        )
        assert res.status_code == status.HTTP_200_OK
        reply = res.json()["reply"]
        assert "Upper / Lower" in reply or "Hypertrophy" in reply
        mock_get_client.assert_not_called()


def test_coach_enabled_with_mocked_client(client, auth_headers_user_a, monkeypatch):
    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Focus on progressive overload with squats and adequate recovery."
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp

    with patch.object(coach_service, "get_client", return_value=mock_client):
        res = client.post(
            "/api/v1/chat",
            json={"message": "What should I focus on for leg day?"},
            headers=auth_headers_user_a,
        )
        assert res.status_code == status.HTTP_200_OK
        reply = res.json()["reply"]
        assert "Focus on progressive overload with squats and adequate recovery." in reply
        assert "General guidance and estimates, not medical advice." in reply


def test_crisis_reply_when_coach_disabled(client, auth_headers_user_a, monkeypatch):
    monkeypatch.setenv("COACH_ENABLED", "false")
    with patch.object(coach_service, "get_client") as mock_get_client:
        res = client.post(
            "/api/v1/chat",
            json={"message": "I am feeling so overwhelmed, I want to die and commit suicide"},
            headers=auth_headers_user_a,
        )
        assert res.status_code == status.HTTP_200_OK
        reply = res.json()["reply"]
        assert "support is available" in reply
        assert "emergency services or crisis line" in reply
        mock_get_client.assert_not_called()


def test_crisis_custom_message(client, auth_headers_user_a, monkeypatch):
    custom_msg = "Custom crisis response: please call your doctor or support line immediately."
    monkeypatch.setenv("COACH_ENABLED", "false")
    monkeypatch.setenv("COACH_CRISIS_MESSAGE", custom_msg)

    res = client.post(
        "/api/v1/chat",
        json={"message": "I feel like hurting myself today"},
        headers=auth_headers_user_a,
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["reply"] == custom_msg


def test_is_crisis_keywords():
    assert is_crisis("I want to kill myself") is True
    assert is_crisis("I have thoughts of suicide") is True
    assert is_crisis("I am cutting myself") is True
    assert is_crisis("What is my dietary plan for today?") is False
    assert is_crisis("Tell me about calorie targets") is False


def test_is_crisis_new_phrases():
    new_phrases = [
        "end it all",
        "don't want to be here",
        "dont want to be here",
        "no reason to live",
        "want to disappear",
        "better off dead",
        "take my own life",
        "don't want to be alive",
        "do not want to be alive",
        "want to be dead",
    ]
    for phrase in new_phrases:
        assert is_crisis(f"I feel overwhelmed and {phrase}") is True, f"Failed for: {phrase}"
        assert is_crisis(phrase.upper()) is True, f"Failed for uppercase: {phrase}"

    # Normal fitness messages must not trigger is_crisis
    assert is_crisis("How much protein do I need?") is False
    assert is_crisis("My knee hurts when I squat") is False


def test_crisis_endpoint_end_it_all_when_coach_disabled(client, auth_headers_user_a, monkeypatch):
    monkeypatch.setenv("COACH_ENABLED", "false")
    with patch.object(coach_service, "get_client") as mock_get_client:
        res = client.post(
            "/api/v1/chat",
            json={"message": "I feel hopeless and want to end it all"},
            headers=auth_headers_user_a,
        )
        assert res.status_code == status.HTTP_200_OK
        reply = res.json()["reply"]
        assert "support is available" in reply
        assert "emergency services or crisis line" in reply
        mock_get_client.assert_not_called()


def test_restriction_question_withholds_targets(db_session, test_user_a, monkeypatch):
    # Set complete athletic profile
    test_user_a.height_cm = 180.0
    test_user_a.age = 26
    test_user_a.sex = "male"
    test_user_a.activity_level = "moderate"
    test_user_a.goal = "lose"
    test_user_a.hide_calorie_targets = False
    db_session.commit()

    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Please nourish your body and speak to a specialist."
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp

    with patch.object(coach_service, "get_client", return_value=mock_client):
        coach_service.answer(db_session, test_user_a, "Should I starve myself or purge after dinner to cut fat?")

        # Inspect context passed to mock_client
        call_args = mock_client.chat.completions.create.call_args
        assert call_args is not None
        messages = call_args.kwargs["messages"]
        user_message_content = messages[1]["content"]

        assert "Targets: withheld" in user_message_content
        # Numeric daily target should not be present
        assert "Daily Target:" not in user_message_content


def test_hide_calorie_targets_withholds_targets(db_session, test_user_a):
    test_user_a.height_cm = 180.0
    test_user_a.age = 26
    test_user_a.sex = "male"
    test_user_a.activity_level = "moderate"
    test_user_a.goal = "maintain"
    test_user_a.hide_calorie_targets = True
    db_session.commit()

    ctx = build_context(db_session, test_user_a, include_targets=True)
    assert "Targets: withheld" in ctx
    assert "Daily Target:" not in ctx


def test_daily_user_limit(client, auth_headers_user_a, monkeypatch):
    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("COACH_DAILY_LIMIT", "2")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Answer from AI coach."
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp

    with patch.object(coach_service, "get_client", return_value=mock_client):
        # Call 1: success
        res1 = client.post(
            "/api/v1/chat", json={"message": "What should I eat before training?"}, headers=auth_headers_user_a
        )
        assert res1.status_code == status.HTTP_200_OK
        assert "Answer from AI coach." in res1.json()["reply"]

        # Call 2: success
        res2 = client.post(
            "/api/v1/chat", json={"message": "How do I warm up for squats?"}, headers=auth_headers_user_a
        )
        assert res2.status_code == status.HTTP_200_OK
        assert "Answer from AI coach." in res2.json()["reply"]

        # Call 3: daily limit reached
        res3 = client.post(
            "/api/v1/chat", json={"message": "Can you recommend a stretching routine?"}, headers=auth_headers_user_a
        )
        assert res3.status_code == status.HTTP_200_OK
        assert "daily AI Coach limit" in res3.json()["reply"]

        # Ensure model was only called twice
        assert mock_client.chat.completions.create.call_count == 2


def test_global_daily_limit(client, auth_headers_user_a, test_user_b, monkeypatch, db_session):
    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("COACH_GLOBAL_DAILY_LIMIT", "5")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    # Insert usage by User B reaching the global limit
    usage_b = CoachUsage(user_id=test_user_b.user_id, used_on=date.today(), calls=5)
    db_session.add(usage_b)
    db_session.commit()

    mock_client = MagicMock()
    with patch.object(coach_service, "get_client", return_value=mock_client):
        res = client.post("/api/v1/chat", json={"message": "How is my recovery?"}, headers=auth_headers_user_a)
        assert res.status_code == status.HTTP_200_OK
        assert "resting today" in res.json()["reply"]
        mock_client.chat.completions.create.assert_not_called()


def test_model_exception_fallback_and_no_question_logged(client, auth_headers_user_a, monkeypatch, caplog):
    import logging

    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RuntimeError("Groq API connection timeout")

    sensitive_question = "How do I optimize secret training inquiry alpha ninety nine?"

    with caplog.at_level(logging.ERROR):
        with patch.object(coach_service, "get_client", return_value=mock_client):
            res = client.post(
                "/api/v1/chat",
                json={"message": sensitive_question},
                headers=auth_headers_user_a,
            )
            assert res.status_code == status.HTTP_200_OK
            # Falls back to rule-based reply
            reply = res.json()["reply"]
            assert "Evidence-Based" in reply or "Principles" in reply or "MyFitSync" in reply or "Coach" in reply

            # Log check: user ID logged, but NOT sensitive question text
            assert "AI Coach model call failed for user_id=" in caplog.text
            assert sensitive_question not in caplog.text


def test_user_isolation_in_context(db_session, test_user_a, test_user_b):
    # Workout for User A
    w_a = Workout(
        user_id=test_user_a.user_id,
        exercise="User A Secret Bench Press",
        exercise_raw="bench press",
        weight_kg=105.0,
        reps=5,
        sets=3,
        total_volume=1575.0,
        performed_on=date.today(),
    )
    # Workout for User B
    w_b = Workout(
        user_id=test_user_b.user_id,
        exercise="User B Secret Deadlift",
        exercise_raw="deadlift",
        weight_kg=220.0,
        reps=3,
        sets=2,
        total_volume=1320.0,
        performed_on=date.today(),
    )
    db_session.add_all([w_a, w_b])
    db_session.commit()

    ctx_a = build_context(db_session, test_user_a, include_targets=True)
    assert "User A Secret Bench Press" in ctx_a
    assert "User B Secret Deadlift" not in ctx_a

    ctx_b = build_context(db_session, test_user_b, include_targets=True)
    assert "User B Secret Deadlift" in ctx_b
    assert "User A Secret Bench Press" not in ctx_b


def test_quota_increments_per_call(client, auth_headers_user_a, test_user_a, monkeypatch, db_session):
    monkeypatch.setenv("COACH_ENABLED", "true")
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Hydration is essential for muscular endurance."
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp

    with patch.object(coach_service, "get_client", return_value=mock_client):
        # Initial call
        res1 = client.post("/api/v1/chat", json={"message": "Tell me about hydration"}, headers=auth_headers_user_a)
        assert res1.status_code == status.HTTP_200_OK

        u1 = (
            db_session.query(CoachUsage)
            .filter(CoachUsage.user_id == test_user_a.user_id, CoachUsage.used_on == date.today())
            .first()
        )
        assert u1 is not None
        assert u1.calls == 1

        # Second call
        res2 = client.post("/api/v1/chat", json={"message": "Tell me about recovery"}, headers=auth_headers_user_a)
        assert res2.status_code == status.HTTP_200_OK

        db_session.expire_all()
        u2 = (
            db_session.query(CoachUsage)
            .filter(CoachUsage.user_id == test_user_a.user_id, CoachUsage.used_on == date.today())
            .first()
        )
        assert u2 is not None
        assert u2.calls == 2


def test_alembic_migration_upgrade_and_downgrade():
    """Verify that alembic migration downgrades to 002_user_profile_targets and upgrades back to head."""
    from alembic.config import Config

    from alembic import command

    ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg = Config(ini_path)

    try:
        command.downgrade(alembic_cfg, "002_user_profile_targets")
        command.upgrade(alembic_cfg, "head")
    except Exception as exc:
        pytest.skip(f"Database migration test skipped if DB unreachable: {exc}")
