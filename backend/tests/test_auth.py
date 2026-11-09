from datetime import timedelta

from fastapi import status

from app.core.security import create_access_token


def test_register_success(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "StrongPassword123!",
            "name": "New User",
            "bodyweight_kg": 77.5,
            "target_calories": 2600,
            "timezone": "UTC",
        },
    )
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert "user_id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client, test_user_a):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user_a.email,  # Duplicate
            "password": "StrongPassword123!",
            "name": "Duplicate User",
            "bodyweight_kg": 75.0,
            "target_calories": 2500,
        },
    )
    assert resp.status_code == status.HTTP_409_CONFLICT
    assert resp.json()["error"]["code"] == "conflict"


def test_register_weak_or_short_password(client):
    # Short password (< 10)
    resp_short = client.post(
        "/api/v1/auth/register",
        json={
            "email": "short@example.com",
            "password": "short",
            "name": "Short Pwd",
            "bodyweight_kg": 75.0,
            "target_calories": 2500,
        },
    )
    assert resp_short.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Common weak password
    resp_weak = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.com",
            "password": "password123",
            "name": "Weak Pwd",
            "bodyweight_kg": 75.0,
            "target_calories": 2500,
        },
    )
    assert resp_weak.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_success(client, test_user_a):
    resp = client.post("/api/v1/auth/login", json={"email": test_user_a.email, "password": "Password123!@#"})
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure_constant_time_message(client, test_user_a):
    # Wrong password
    resp_wrong_pw = client.post(
        "/api/v1/auth/login", json={"email": test_user_a.email, "password": "WrongPassword999!"}
    )
    assert resp_wrong_pw.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp_wrong_pw.json()["error"]["message"] == "Invalid email or password."

    # Non-existent email (must yield identical message to avoid leaking user presence)
    resp_no_user = client.post(
        "/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "SomePassword123!"}
    )
    assert resp_no_user.status_code == status.HTTP_401_UNAUTHORIZED
    assert resp_no_user.json()["error"]["message"] == "Invalid email or password."


def test_token_tampered_or_expired(client):
    # Tampered token
    resp_tampered = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer totally_bogus_tampered_token"})
    assert resp_tampered.status_code == status.HTTP_401_UNAUTHORIZED

    # Expired token
    expired_token = create_access_token("user-expired", expires_delta=timedelta(seconds=-10))
    resp_expired = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp_expired.status_code == status.HTTP_401_UNAUTHORIZED
    assert "expired" in resp_expired.json()["error"]["message"].lower()


def test_protected_route_unauthenticated(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
