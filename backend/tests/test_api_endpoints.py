from datetime import date
from fastapi import status

def test_ops_health_checks(client):
    res_liveness = client.get("/api/v1/health")
    assert res_liveness.status_code == status.HTTP_200_OK
    assert res_liveness.json()["status"] == "ok"

    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == status.HTTP_200_OK
    assert res_ready.json()["status"] == "ready"

def test_workouts_crud_flow(client, auth_headers_user_a):
    # 1. Create Workout
    create_payload = {
        "exercise": "bench_press",
        "exercise_raw": "Flat Bench",
        "weight_kg": 100.0,
        "reps": 5,
        "sets": 3,
        "rpe": 8.5,
        "performed_on": str(date.today())
    }
    res_create = client.post("/api/v1/workouts", json=create_payload, headers=auth_headers_user_a)
    assert res_create.status_code == status.HTTP_201_CREATED
    workout_data = res_create.json()
    workout_id = workout_data["id"]
    assert workout_data["exercise"] == "bench_press"
    assert workout_data["total_volume"] == 1500.0
    assert workout_data["estimated_1rm"] == 112.5

    # 2. Get Workout
    res_get = client.get(f"/api/v1/workouts/{workout_id}", headers=auth_headers_user_a)
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["id"] == workout_id

    # 3. List Workouts (with pagination)
    res_list = client.get("/api/v1/workouts?page=1&page_size=10", headers=auth_headers_user_a)
    assert res_list.status_code == status.HTTP_200_OK
    assert res_list.json()["total"] >= 1
    assert len(res_list.json()["items"]) >= 1

    # 4. Update Workout
    update_payload = {"weight_kg": 105.0}
    res_put = client.put(f"/api/v1/workouts/{workout_id}", json=update_payload, headers=auth_headers_user_a)
    assert res_put.status_code == status.HTTP_200_OK
    assert res_put.json()["weight_kg"] == 105.0
    assert res_put.json()["total_volume"] == 1575.0

    # 5. Delete Workout
    res_del = client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers_user_a)
    assert res_del.status_code == status.HTTP_204_NO_CONTENT

    # 6. Verify 404 after deletion
    res_verify = client.get(f"/api/v1/workouts/{workout_id}", headers=auth_headers_user_a)
    assert res_verify.status_code == status.HTTP_404_NOT_FOUND

def test_nutrition_crud_and_daily_totals(client, auth_headers_user_a):
    today = str(date.today())
    payload = {
        "meal_title": "Lunch",
        "calories": 750.0,
        "protein_g": 50.0,
        "carbs_g": 80.0,
        "fat_g": 20.0,
        "eaten_on": today
    }
    # Create
    res_create = client.post("/api/v1/nutrition", json=payload, headers=auth_headers_user_a)
    assert res_create.status_code == status.HTTP_201_CREATED
    nutr_id = res_create.json()["id"]

    # Daily totals
    res_totals = client.get(f"/api/v1/nutrition/daily-totals?date={today}", headers=auth_headers_user_a)
    assert res_totals.status_code == status.HTTP_200_OK
    tot_data = res_totals.json()
    assert tot_data["calories"] == 750.0
    assert tot_data["protein_g"] == 50.0

    # Delete
    res_del = client.delete(f"/api/v1/nutrition/{nutr_id}", headers=auth_headers_user_a)
    assert res_del.status_code == status.HTTP_204_NO_CONTENT

def test_readiness_upsert_flow(client, auth_headers_user_a):
    today = str(date.today())
    # Create first entry
    p1 = {"sleep_hours": 7.0, "soreness_score": 4.0, "resting_hr": 55, "logged_date": today}
    res1 = client.post("/api/v1/readiness", json=p1, headers=auth_headers_user_a)
    assert res1.status_code == status.HTTP_201_CREATED
    assert res1.json()["sleep_hours"] == 7.0

    # Upsert on same date with updated sleep
    p2 = {"sleep_hours": 8.0, "logged_date": today}
    res2 = client.post("/api/v1/readiness", json=p2, headers=auth_headers_user_a)
    assert res2.status_code == status.HTTP_201_CREATED
    assert res2.json()["sleep_hours"] == 8.0
    assert res2.json()["soreness_score"] == 4.0  # Preserved previous non-null field

def test_chat_endpoint_persistence_and_idempotency(client, auth_headers_user_a):
    headers = dict(auth_headers_user_a)
    headers["X-Idempotency-Key"] = "idem-test-key-12345"

    msg = "Squats 100 kg 5 reps 3 sets at RPE 8, ate 2200 kcal with 160 g protein, slept 7 hours."
    res1 = client.post("/api/v1/chat", json={"message": msg}, headers=headers)
    assert res1.status_code == status.HTTP_200_OK
    data1 = res1.json()
    assert len(data1["saved"]["workouts"]) == 1
    assert len(data1["saved"]["nutrition"]) == 1
    assert len(data1["saved"]["readiness"]) == 1
    assert data1["metrics"]["session_volume_kg"] == 1500.0

    # Resend with exact same X-Idempotency-Key
    res2 = client.post("/api/v1/chat", json={"message": msg}, headers=headers)
    assert res2.status_code == status.HTTP_200_OK
    data2 = res2.json()
    assert data2["reply"] == data1["reply"]
    assert data2["saved"]["workouts"][0]["id"] == data1["saved"]["workouts"][0]["id"]

def test_dashboard_endpoint(client, auth_headers_user_a):
    res = client.get("/api/v1/dashboard", headers=auth_headers_user_a)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "totals" in data
    assert "latest_e1rm" in data
    assert "today_nutrition" in data
    assert "last_readiness" in data
    assert "acwr" in data
    assert "recent_activity" in data
    assert "is_empty" in data

def test_analytics_endpoints(client, auth_headers_user_a):
    assert client.get("/api/v1/analytics/acwr", headers=auth_headers_user_a).status_code == 200
    assert client.get("/api/v1/analytics/strength", headers=auth_headers_user_a).status_code == 200
    assert client.get("/api/v1/analytics/volume?group_by=daily", headers=auth_headers_user_a).status_code == 200
    assert client.get("/api/v1/analytics/volume?group_by=weekly", headers=auth_headers_user_a).status_code == 200
    assert client.get("/api/v1/analytics/nutrition", headers=auth_headers_user_a).status_code == 200
