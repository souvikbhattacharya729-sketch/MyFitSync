#!/usr/bin/env python3
"""
MyFitSync End-to-End Stack Integration Verification Suite
Validates real SQL Server persistence, NLP multi-intent processing,
idempotency caching, sports science equations, and strict cross-user data isolation.
"""

import os
import sys
import uuid
import json
import urllib.request
import urllib.error

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")

class E2EError(Exception):
    pass

def api_call(endpoint: str, method: str = "GET", data: dict = None, token: str = None, headers_extra: dict = None) -> tuple[int, dict]:
    url = f"{API_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if headers_extra:
        headers.update(headers_extra)
    
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            if status == 204:
                return status, {}
            raw = resp.read().decode("utf-8")
            return status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            body = json.loads(raw)
        except Exception:
            body = {"detail": raw}
        return e.code, body

def run_e2e():
    print(f"=== Starting MyFitSync End-to-End Integration Test Suite ===")
    print(f"Target API: {API_BASE}\n")

    # Step 1: Healthcheck
    status, health = api_call("/health/ready")
    if status != 200 or health.get("status") != "ready":
        raise E2EError(f"Healthcheck failed ({status}): {health}")
    print(" [1/11] System Health & SQL Server Connection: PASS")

    # Step 2: Register Fresh User A
    run_id = uuid.uuid4().hex[:8]
    user_a_email = f"e2e_athlete_a_{run_id}@example.com"
    user_a_pwd = f"Str0ngPass_{run_id}!"
    
    status, reg_a = api_call("/auth/register", method="POST", data={
        "email": user_a_email,
        "password": user_a_pwd,
        "name": f"Athlete A {run_id}",
        "bodyweight_kg": 80.0,
        "target_calories": 2500,
        "timezone": "UTC"
    })
    if status != 201 or not reg_a.get("user_id"):
        raise E2EError(f"User A Registration failed ({status}): {reg_a}")
    user_a_id = reg_a["user_id"]
    print(f" [2/11] User A Registration (UUID={user_a_id}): PASS")

    # Step 3: Login User A
    status, login_a = api_call("/auth/login", method="POST", data={
        "email": user_a_email,
        "password": user_a_pwd
    })
    if status != 200 or not login_a.get("access_token"):
        raise E2EError(f"User A Login failed ({status}): {login_a}")
    token_a = login_a["access_token"]
    print(" [3/11] User A Authentication & JWT Issuance: PASS")

    # Step 4: Natural Language Multi-Intent Log with Idempotency Key
    idempotency_key = f"e2e-multi-intent-{run_id}"
    nlp_prompt = "Squats 100 kg 5 reps 3 sets at RPE 8, bench 70 kg for 8 reps x 3, ate 2200 kcal with 160 g protein, slept 7 hours"
    
    status, chat_res_1 = api_call("/chat", method="POST", data={
        "message": nlp_prompt,
        "timezone": "UTC"
    }, token=token_a, headers_extra={"X-Idempotency-Key": idempotency_key})

    if status != 200:
        raise E2EError(f"Chat execution failed ({status}): {chat_res_1}")
    
    saved_1 = chat_res_1.get("saved", {})
    workouts_saved = saved_1.get("workouts", [])
    nutrition_saved = saved_1.get("nutrition", [])
    readiness_saved = saved_1.get("readiness", [])

    if len(workouts_saved) < 2 or len(nutrition_saved) < 1 or len(readiness_saved) < 1:
        raise E2EError(f"Multi-intent NLP did not parse all clauses properly: {saved_1}")
    print(f" [4/11] Multi-Intent NLP Clause Segmentation ({len(workouts_saved)} workouts, {len(nutrition_saved)} meals, {len(readiness_saved)} readiness): PASS")

    # Step 5: Verify Idempotency Deduplication
    status, chat_res_2 = api_call("/chat", method="POST", data={
        "message": nlp_prompt,
        "timezone": "UTC"
    }, token=token_a, headers_extra={"X-Idempotency-Key": idempotency_key})

    if status != 200 or chat_res_2.get("reply") != chat_res_1.get("reply"):
        raise E2EError(f"Idempotency cache replay failed ({status})")
    print(" [5/11] Idempotency Caching & Deduplication (X-Idempotency-Key): PASS")

    # Step 6: Query SQL Server & Verify Sports Science Computations
    status, workout_list = api_call("/workouts", token=token_a)
    if status != 200 or workout_list.get("total") != 2:
        raise E2EError(f"Expected exactly 2 workouts in DB, got: {workout_list}")
    
    items = workout_list["items"]
    squat_item = next((w for w in items if "squat" in w["exercise"]), None)
    bench_item = next((w for w in items if "bench" in w["exercise"]), None)
    
    if not squat_item or not bench_item:
        raise E2EError(f"Workouts missing: {items}")
    
    # Verify Squat Volume & 1RM
    # 100 kg * 5 reps * 3 sets = 1500 kg volume
    # Brzycki: 100 / (1.0278 - 0.0278 * 5) = 112.51 kg
    expected_squat_vol = 1500.0
    if abs(squat_item["total_volume"] - expected_squat_vol) > 0.1:
        raise E2EError(f"Squat volume mismatch: expected {expected_squat_vol}, got {squat_item['total_volume']}")
    if squat_item["estimated_1rm"] is None or abs(squat_item["estimated_1rm"] - 112.5) > 1.0:
        raise E2EError(f"Squat 1RM mismatch: expected ~112.5, got {squat_item['estimated_1rm']}")
    
    # Verify Bench Volume: 70 * 8 * 3 = 1680 kg
    expected_bench_vol = 1680.0
    if abs(bench_item["total_volume"] - expected_bench_vol) > 0.1:
        raise E2EError(f"Bench volume mismatch: expected {expected_bench_vol}, got {bench_item['total_volume']}")
    
    print(f" [6/11] Sports Science (Volume=1500kg, Brzycki 1RM={squat_item['estimated_1rm']}kg): PASS")

    # Step 7: Verify Nutrition and Readiness Database Records
    status, nutr_list = api_call("/nutrition", token=token_a)
    if status != 200 or nutr_list.get("total") < 1:
        raise E2EError(f"Nutrition record not persisted: {nutr_list}")
    meal_item = nutr_list["items"][0]
    if meal_item["calories"] != 2200 or meal_item["protein_g"] != 160:
        raise E2EError(f"Nutrition values mismatch: {meal_item}")

    status, read_list = api_call("/readiness", token=token_a)
    if status != 200 or read_list.get("total") < 1:
        raise E2EError(f"Readiness record not persisted: {read_list}")
    read_item = read_list["items"][0]
    if read_item["sleep_hours"] != 7.0:
        raise E2EError(f"Readiness sleep mismatch: {read_item}")

    print(" [7/11] Nutrition & Readiness Database Persistence: PASS")

    # Step 8: Dashboard Aggregations
    status, dash = api_call("/dashboard", token=token_a)
    if status != 200:
        raise E2EError(f"Dashboard query failed ({status}): {dash}")
    
    dash_totals = dash.get("totals", {})
    if dash_totals.get("workouts_count") != 2:
        raise E2EError(f"Dashboard workout count mismatch: {dash_totals}")
    if abs(dash_totals.get("total_volume_kg", 0) - 3180.0) > 0.1:
        raise E2EError(f"Dashboard total volume mismatch: expected 3180.0, got {dash_totals.get('total_volume_kg')}")
    
    print(" [8/11] Real-Time Dashboard Aggregations (Total Volume = 3,180 kg): PASS")

    # Step 9: Workout Resource Mutation (PUT)
    squat_id = squat_item["id"]
    status, updated_workout = api_call(f"/workouts/{squat_id}", method="PUT", data={
        "weight_kg": 110.0,
        "reps": 5,
        "sets": 3
    }, token=token_a)
    if status != 200 or updated_workout.get("weight_kg") != 110.0:
        raise E2EError(f"Workout update failed: {updated_workout}")
    # Volume should now be 110 * 5 * 3 = 1650
    if abs(updated_workout["total_volume"] - 1650.0) > 0.1:
        raise E2EError(f"Updated volume mismatch: {updated_workout}")
    
    print(" [9/11] Transactional Mutation & Dynamic Recalculation: PASS")

    # Step 10: Strict Cross-User Data Isolation Verification (Non-Negotiable Rule)
    user_b_email = f"e2e_athlete_b_{run_id}@example.com"
    user_b_pwd = f"Str0ngPassB_{run_id}!"
    status, _ = api_call("/auth/register", method="POST", data={
        "email": user_b_email,
        "password": user_b_pwd,
        "name": f"Athlete B {run_id}",
    })
    status, login_b = api_call("/auth/login", method="POST", data={
        "email": user_b_email,
        "password": user_b_pwd
    })
    token_b = login_b["access_token"]

    # User B attempts to access User A's workout: MUST return 404
    status, b_get = api_call(f"/workouts/{squat_id}", token=token_b)
    if status != 404:
        raise E2EError(f"SECURITY BREACH: User B could access User A workout! Status={status}, res={b_get}")

    # User B attempts to edit User A's workout: MUST return 404
    status, b_put = api_call(f"/workouts/{squat_id}", method="PUT", data={"weight_kg": 50.0}, token=token_b)
    if status != 404:
        raise E2EError(f"SECURITY BREACH: User B could update User A workout! Status={status}, res={b_put}")

    # User B attempts to delete User A's workout: MUST return 404
    status, b_del = api_call(f"/workouts/{squat_id}", method="DELETE", token=token_b)
    if status != 404:
        raise E2EError(f"SECURITY BREACH: User B could delete User A workout! Status={status}, res={b_del}")

    # User B attempts to access User A's nutrition: MUST return 404
    meal_id = meal_item["id"]
    status, b_nutr = api_call(f"/nutrition/{meal_id}", token=token_b)
    if status != 404:
        raise E2EError(f"SECURITY BREACH: User B could access User A meal! Status={status}, res={b_nutr}")

    print(" [10/11] Multi-Tenant Data Isolation (Strict 404 Not Found on cross-user access): PASS")

    # Step 11: Workout Deletion
    status, _ = api_call(f"/workouts/{squat_id}", method="DELETE", token=token_a)
    if status != 204:
        raise E2EError(f"Delete workout failed ({status})")
    status, _ = api_call(f"/workouts/{squat_id}", token=token_a)
    if status != 404:
        raise E2EError(f"Workout still accessible after deletion! Status={status}")

    print(" [11/11] Idempotent Resource Deletion (204 No Content -> 404 Not Found): PASS")

    print("\n========================================================")
    print(" ALL 11 END-TO-END INTEGRATION TEST CRITERIA PASSED!")
    print("========================================================\n")

if __name__ == "__main__":
    try:
        run_e2e()
    except Exception as e:
        print(f"\n❌ E2E TEST FAILED: {e}")
        sys.exit(1)
