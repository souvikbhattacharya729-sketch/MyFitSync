#!/usr/bin/env python3
"""
MyFitSync Deterministic Demo Data Seeder
Seeds realistic athletic history (28 days of progressive overload workouts, 
macro-balanced nutrition, and readiness entries) into PostgreSQL / Supabase.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import date, timedelta

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")

def api_request(endpoint: str, method: str = "GET", data: dict = None, token: str = None) -> dict:
    url = f"{API_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 204:
                return {}
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            return {"_error": True, "status": e.code, "detail": json.loads(err_msg)}
        except Exception:
            return {"_error": True, "status": e.code, "detail": err_msg}

def seed():
    print(f"Connecting to MyFitSync API at: {API_BASE}")
    
    # Check Health
    health = api_request("/health/ready")
    if health.get("status") != "ready":
        print(f"Error: API is not ready ({health}). Aborting.")
        sys.exit(1)
    print("✓ Healthcheck Ready: Database connected.")

    # 1. Register or Login Demo User
    demo_user_data = {
        "email": "demo@myfitsync.io",
        "password": "MyFitDemo2026!",
        "name": "Alex Mercer",
        "bodyweight_kg": 78.5,
        "target_calories": 2600,
        "target_protein_g": 160.0,
        "target_carbs_g": 280.0,
        "target_fat_g": 75.0,
        "timezone": "UTC"
    }
    
    reg_res = api_request("/auth/register", method="POST", data=demo_user_data)
    if reg_res.get("_error") and reg_res.get("status") != 409:
        print(f"Registration failed: {reg_res}")
        sys.exit(1)

    login_res = api_request("/auth/login", method="POST", data={
        "email": demo_user_data["email"],
        "password": demo_user_data["password"]
    })
    if login_res.get("_error"):
        print(f"Login failed: {login_res}")
        sys.exit(1)
    
    demo_token = login_res["access_token"]
    print(f"✓ Authenticated as Demo User: {demo_user_data['email']}")

    # 2. Seed 28 Days of Historical Data
    today = date.today()
    start_date = today - timedelta(days=28)
    
    print("Seeding 28 days of progressive overload workouts, nutrition, and readiness...")
    
    workout_templates = [
        # Day 0 (Mon): Lower Heavy
        [
            {"exercise": "squat", "weight_kg": 105.0, "reps": 5, "sets": 4, "rpe": 8.0},
            {"exercise": "romanian_deadlift", "weight_kg": 90.0, "reps": 8, "sets": 3, "rpe": 7.5},
        ],
        # Day 1 (Tue): Upper Strength
        [
            {"exercise": "bench_press", "weight_kg": 82.5, "reps": 6, "sets": 4, "rpe": 8.0},
            {"exercise": "barbell_row", "weight_kg": 75.0, "reps": 8, "sets": 3, "rpe": 7.5},
            {"exercise": "overhead_press", "weight_kg": 50.0, "reps": 6, "sets": 3, "rpe": 8.0},
        ],
        # Day 2 (Wed): Rest
        [],
        # Day 3 (Thu): Deadlift Focus
        [
            {"exercise": "deadlift", "weight_kg": 140.0, "reps": 5, "sets": 3, "rpe": 8.5},
            {"exercise": "pull_up", "weight_kg": 10.0, "reps": 6, "sets": 3, "rpe": 8.0},
        ],
        # Day 4 (Fri): Hypertrophy
        [
            {"exercise": "incline_dumbbell_press", "weight_kg": 30.0, "reps": 10, "sets": 3, "rpe": 8.0},
            {"exercise": "squat", "weight_kg": 95.0, "reps": 8, "sets": 3, "rpe": 7.5},
        ],
        # Day 5 (Sat): Rest
        [],
        # Day 6 (Sun): Rest
        []
    ]

    total_workouts = 0
    total_meals = 0
    total_readiness = 0

    for day_idx in range(29):
        current_date = start_date + timedelta(days=day_idx)
        date_str = current_date.isoformat()
        day_of_week = current_date.weekday() # 0 = Monday

        # Progressive overload weight modifier (+0.5% per week)
        progression_factor = 1.0 + (day_idx / 28.0) * 0.08

        # A. Workouts
        day_exercises = workout_templates[day_of_week]
        for ex in day_exercises:
            adjusted_weight = round(ex["weight_kg"] * progression_factor, 1)
            w_res = api_request("/workouts", method="POST", data={
                "exercise": ex["exercise"],
                "weight_kg": adjusted_weight,
                "reps": ex["reps"],
                "sets": ex["sets"],
                "rpe": ex["rpe"],
                "performed_on": date_str
            }, token=demo_token)
            if not w_res.get("_error"):
                total_workouts += 1
            else:
                print(f"Workout error: {w_res}")

        # B. Nutrition (Balanced 3 meals + shake every day)
        meals = [
            {"title": "Oatmeal & Protein Shake", "cal": 650, "p": 45.0, "c": 75.0, "f": 15.0},
            {"title": "Grilled Chicken Rice Bowl", "cal": 850, "p": 60.0, "c": 95.0, "f": 20.0},
            {"title": "Salmon Sweet Potato Dinner", "cal": 750, "p": 48.0, "c": 70.0, "f": 26.0},
            {"title": "Greek Yogurt & Almonds Snack", "cal": 320, "p": 25.0, "c": 15.0, "f": 14.0},
        ]
        for m in meals:
            n_res = api_request("/nutrition", method="POST", data={
                "meal_title": m["title"],
                "calories": m["cal"],
                "protein_g": m["p"],
                "carbs_g": m["c"],
                "fat_g": m["f"],
                "eaten_on": date_str
            }, token=demo_token)
            if not n_res.get("_error"):
                total_meals += 1
            else:
                print(f"Nutrition error: {n_res}")

        # C. Daily Readiness
        sleep = round(7.2 + (day_idx % 4) * 0.3, 1)
        soreness = 3.0 if len(day_exercises) == 0 else (5.0 if day_idx % 2 == 0 else 4.0)
        rhr = 52 + (day_idx % 5)
        
        r_res = api_request("/readiness", method="POST", data={
            "sleep_hours": sleep,
            "soreness_score": soreness,
            "resting_hr": rhr,
            "logged_date": date_str
        }, token=demo_token)
        if not r_res.get("_error"):
            total_readiness += 1

    print(f"✓ Seeded {total_workouts} workouts, {total_meals} meals, {total_readiness} daily readiness entries.")

    # 3. Register & Seed Isolated User B
    iso_user_data = {
        "email": "isolated@myfitsync.io",
        "password": "IsoUserPass2026!",
        "name": "Jordan Hayes",
        "bodyweight_kg": 68.0,
        "target_calories": 2200,
        "target_protein_g": 140.0,
        "target_carbs_g": 240.0,
        "target_fat_g": 60.0,
        "timezone": "UTC"
    }
    api_request("/auth/register", method="POST", data=iso_user_data)
    iso_login = api_request("/auth/login", method="POST", data={
        "email": iso_user_data["email"],
        "password": iso_user_data["password"]
    })
    iso_token = iso_login.get("access_token")
    if iso_token:
        # Seed 1 private workout
        api_request("/workouts", method="POST", data={
            "exercise": "kettlebell_swing",
            "weight_kg": 24.0,
            "reps": 15,
            "sets": 4,
            "rpe": 8.0,
            "performed_on": today.isoformat()
        }, token=iso_token)
        print("✓ Created secondary isolated athlete account for cross-user permission verification.")

    # 4. Verify Dashboard & ACWR Metrics
    dash = api_request("/dashboard", token=demo_token)
    totals = dash.get("totals", {})
    print("\n--- Verified Live Dashboard Status ---")
    print(f"Total Workouts logged: {totals.get('workouts_count')}")
    print(f"Total Volume: {totals.get('total_volume_kg')} kg")
    print(f"Active Training Days: {totals.get('active_days')}")
    
    acwr = dash.get("acwr", {})
    print(f"ACWR Status: {acwr.get('status')} | Zone: {acwr.get('zone')} | Ratio: {acwr.get('acwr')}")
    print(f"ACWR Acute Load: {acwr.get('acute_load')} kg/day | Chronic Load: {acwr.get('chronic_load')} kg/day")
    print(f"ACWR History Days: {acwr.get('days_of_history')}")
    print("Demo Seeding Complete!\n")

if __name__ == "__main__":
    seed()
