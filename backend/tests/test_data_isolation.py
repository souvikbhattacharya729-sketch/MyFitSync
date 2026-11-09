from datetime import date

from fastapi import status


def test_data_isolation_workouts(client, auth_headers_user_a, auth_headers_user_b):
    # User B creates a workout
    p_b = {
        "exercise": "deadlift",
        "exercise_raw": "Deadlift",
        "weight_kg": 200.0,
        "reps": 3,
        "sets": 3,
        "performed_on": str(date.today()),
    }
    res_b = client.post("/api/v1/workouts", json=p_b, headers=auth_headers_user_b)
    assert res_b.status_code == status.HTTP_201_CREATED
    workout_b_id = res_b.json()["id"]

    # User A tries to GET User B's workout -> MUST return 404 (not 403)
    res_a_get = client.get(f"/api/v1/workouts/{workout_b_id}", headers=auth_headers_user_a)
    assert res_a_get.status_code == status.HTTP_404_NOT_FOUND

    # User A tries to PUT (modify) User B's workout -> MUST return 404
    res_a_put = client.put(f"/api/v1/workouts/{workout_b_id}", json={"weight_kg": 50.0}, headers=auth_headers_user_a)
    assert res_a_put.status_code == status.HTTP_404_NOT_FOUND

    # Verify User B's workout remains unchanged
    res_b_verify = client.get(f"/api/v1/workouts/{workout_b_id}", headers=auth_headers_user_b)
    assert res_b_verify.status_code == status.HTTP_200_OK
    assert res_b_verify.json()["weight_kg"] == 200.0

    # User A tries to DELETE User B's workout -> MUST return 404
    res_a_del = client.delete(f"/api/v1/workouts/{workout_b_id}", headers=auth_headers_user_a)
    assert res_a_del.status_code == status.HTTP_404_NOT_FOUND

    # Verify User B's workout was NOT deleted
    res_b_still_there = client.get(f"/api/v1/workouts/{workout_b_id}", headers=auth_headers_user_b)
    assert res_b_still_there.status_code == status.HTTP_200_OK


def test_data_isolation_nutrition(client, auth_headers_user_a, auth_headers_user_b):
    # User B creates nutrition entry
    p_b = {"meal_title": "Secret Feast", "calories": 1500.0, "protein_g": 100.0, "eaten_on": str(date.today())}
    res_b = client.post("/api/v1/nutrition", json=p_b, headers=auth_headers_user_b)
    nutr_b_id = res_b.json()["id"]

    # User A GET -> 404
    assert client.get(f"/api/v1/nutrition/{nutr_b_id}", headers=auth_headers_user_a).status_code == 404

    # User A UPDATE -> 404
    assert (
        client.put(f"/api/v1/nutrition/{nutr_b_id}", json={"calories": 100.0}, headers=auth_headers_user_a).status_code
        == 404
    )

    # User A DELETE -> 404
    assert client.delete(f"/api/v1/nutrition/{nutr_b_id}", headers=auth_headers_user_a).status_code == 404

    # User A listing nutrition must not see User B's entry
    res_a_list = client.get("/api/v1/nutrition", headers=auth_headers_user_a)
    ids_in_a = [item["id"] for item in res_a_list.json()["items"]]
    assert nutr_b_id not in ids_in_a


def test_data_isolation_readiness(client, auth_headers_user_a, auth_headers_user_b):
    # User B logs readiness
    p_b = {"sleep_hours": 9.0, "resting_hr": 48, "logged_date": str(date.today())}
    res_b = client.post("/api/v1/readiness", json=p_b, headers=auth_headers_user_b)
    readiness_b_id = res_b.json()["id"]

    # User A GET -> 404
    assert client.get(f"/api/v1/readiness/{readiness_b_id}", headers=auth_headers_user_a).status_code == 404

    # User A DELETE -> 404
    assert client.delete(f"/api/v1/readiness/{readiness_b_id}", headers=auth_headers_user_a).status_code == 404


def test_data_isolation_dashboard_and_analytics(client, auth_headers_user_a, auth_headers_user_b):
    # User B logs a heavy squat
    client.post(
        "/api/v1/workouts",
        json={"exercise": "squat", "weight_kg": 250.0, "reps": 5, "sets": 5, "performed_on": str(date.today())},
        headers=auth_headers_user_b,
    )

    # User A's dashboard must NOT show User B's squat
    res_a_dash = client.get("/api/v1/dashboard", headers=auth_headers_user_a)
    dash_a = res_a_dash.json()
    assert dash_a["latest_e1rm"].get("squat") != 281.25  # E1RM of 250x5
    assert dash_a["totals"]["total_volume_kg"] != 6250.0
