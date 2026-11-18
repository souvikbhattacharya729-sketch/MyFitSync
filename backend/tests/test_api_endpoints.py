from datetime import date

from fastapi import status


def test_ops_health_checks(client):
    res_root = client.get("/")
    assert res_root.status_code == status.HTTP_200_OK
    assert res_root.json()["status"] == "healthy"
    assert "service" in res_root.json()

    res_root_head = client.head("/")
    assert res_root_head.status_code == status.HTTP_200_OK

    res_top_health = client.get("/health")
    assert res_top_health.status_code == status.HTTP_200_OK
    assert res_top_health.json()["status"] == "ok"

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
        "performed_on": str(date.today()),
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
        "eaten_on": today,
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


def test_nutrition_estimate_endpoint(client, auth_headers_user_a):
    # 1. Exact / Substring lookup: Boiled egg (2 pcs)
    res_egg = client.post(
        "/api/v1/nutrition/estimate",
        json={"food_name": "Boiled egg", "quantity": 2.0, "unit": "pcs"},
        headers=auth_headers_user_a,
    )
    assert res_egg.status_code == status.HTTP_200_OK
    egg_data = res_egg.json()
    assert egg_data["calories"] == 156.0
    assert egg_data["protein_g"] == 12.6
    assert egg_data["unit"] == "pcs"
    assert egg_data["confidence"] == "verified_database"

    # 2. Metric conversion: Chicken breast (150 grms)
    res_chicken = client.post(
        "/api/v1/nutrition/estimate",
        json={"food_name": "Chicken breast", "quantity": 150.0, "unit": "grms"},
        headers=auth_headers_user_a,
    )
    assert res_chicken.status_code == status.HTTP_200_OK
    chicken_data = res_chicken.json()
    assert chicken_data["calories"] > 0
    assert chicken_data["protein_g"] > 0
    assert chicken_data["confidence"] == "verified_database"

    # 3. AI Heuristic for unlisted food: Avocado sandwich
    res_ai = client.post(
        "/api/v1/nutrition/estimate",
        json={"food_name": "Avocado sandwich", "quantity": 1.0, "unit": "pcs"},
        headers=auth_headers_user_a,
    )
    assert res_ai.status_code == status.HTTP_200_OK
    ai_data = res_ai.json()
    assert ai_data["calories"] > 0
    assert ai_data["confidence"] == "ai_heuristic"


def test_chat_ai_conversational_queries(client, auth_headers_user_a):
    # 1. Ask food/nutrition question
    res_nut = client.post(
        "/api/v1/chat",
        json={"message": "How many calories and protein in 3 boiled eggs and 100g oats?"},
        headers=auth_headers_user_a,
    )
    assert res_nut.status_code == status.HTTP_200_OK
    data_nut = res_nut.json()
    assert "Nutrition Intelligence Breakdown" in data_nut["reply"] or "eggs" in data_nut["reply"].lower()

    # 2. Ask workout program / split question
    res_split = client.post(
        "/api/v1/chat",
        json={"message": "Give me a 4 day upper lower split for hypertrophy"},
        headers=auth_headers_user_a,
    )
    assert res_split.status_code == status.HTTP_200_OK
    assert "Upper / Lower" in res_split.json()["reply"] or "Hypertrophy" in res_split.json()["reply"]

    # 3. Ask recovery question
    res_rec = client.post(
        "/api/v1/chat",
        json={"message": "My soreness is very high, should I train heavy today?"},
        headers=auth_headers_user_a,
    )
    assert res_rec.status_code == status.HTTP_200_OK
    assert "Recovery & ACWR Directive" in res_rec.json()["reply"] or "soreness" in res_rec.json()["reply"].lower()

    # 4. General coaching prompt
    res_gen = client.post(
        "/api/v1/chat",
        json={"message": "Hey coach, what can you help me with?"},
        headers=auth_headers_user_a,
    )
    assert res_gen.status_code == status.HTTP_200_OK
    assert "MyFitSync" in res_gen.json()["reply"] or "Coach" in res_gen.json()["reply"]


def test_targets_endpoint_flow_and_isolation(client, auth_headers_user_a, auth_headers_user_b):
    # 1. User A initial targets check (incomplete profile)
    res_init = client.get("/api/v1/targets", headers=auth_headers_user_a)
    assert res_init.status_code == status.HTTP_200_OK
    init_data = res_init.json()
    assert init_data["profile_complete"] is False
    assert "height_cm" in init_data["missing_fields"]
    assert "age" in init_data["missing_fields"]
    assert "disclaimer" in init_data
    assert "nationaleatingdisorders.org" in init_data["eating_disorder_help_url"]

    # 2. Update User A's profile with complete biometric parameters
    update_payload = {
        "bodyweight_kg": 80.0,
        "height_cm": 180.0,
        "age": 30,
        "sex": "male",
        "activity_level": "moderate",
        "goal": "lose",
        "hide_calorie_targets": False,
    }
    res_update = client.patch("/api/v1/auth/me", json=update_payload, headers=auth_headers_user_a)
    assert res_update.status_code == status.HTTP_200_OK
    assert res_update.json()["height_cm"] == 180.0
    assert res_update.json()["goal"] == "lose"

    # 3. Retrieve targets for User A (now complete)
    res_targets = client.get("/api/v1/targets", headers=auth_headers_user_a)
    assert res_targets.status_code == status.HTTP_200_OK
    target_data = res_targets.json()
    assert target_data["profile_complete"] is True
    assert target_data["missing_fields"] == []
    # BMR: 10*80 + 6.25*180 - 5*30 + 5 = 1780.0
    assert target_data["bmr"] == 1780.0
    # TDEE: 1780 * 1.55 = 2759.0
    assert target_data["tdee"] == 2759.0
    # Goal lose: 2759.0 - 500 = 2259.0 -> 2259 kcal
    assert target_data["calorie_target"] == 2259
    assert target_data["macros"]["protein_g"] == 144.0  # 80 * 1.8
    assert target_data["macros"]["fat_g"] > 0
    assert target_data["macros"]["carbs_g"] > 0

    # 4. Multi-tenant isolation: User B's targets should remain distinct / incomplete
    res_b = client.get("/api/v1/targets", headers=auth_headers_user_b)
    assert res_b.status_code == status.HTTP_200_OK
    data_b = res_b.json()
    assert data_b["profile_complete"] is False  # User B hasn't set their height/age/etc.

    # 5. Hide calorie targets toggle test
    res_hide = client.patch("/api/v1/auth/me", json={"hide_calorie_targets": True}, headers=auth_headers_user_a)
    assert res_hide.status_code == status.HTTP_200_OK
    assert res_hide.json()["hide_calorie_targets"] is True
    res_targets_hidden = client.get("/api/v1/targets", headers=auth_headers_user_a)
    assert res_targets_hidden.json()["hide_calorie_targets"] is True
