import json

import httpx

from tests.conftest import REST, make_token


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_rejects_bad_signature(client):
    bad = make_token("x", secret="wrong-secret-wrong-secret-wrong!!")
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {bad}"}).status_code == 401


def test_rejects_wrong_audience(client):
    tok = make_token("x", aud="anon")
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_no_profile_is_forbidden(client, respx_mock):
    respx_mock.get(f"{REST}/profiles").respond(json=[])
    tok = make_token("ghost")
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 403


def test_student_cannot_create_drive(client, as_role):
    h = as_role("student")
    r = client.post("/drives", headers=h, json={"company_name": "Acme", "role_offered": "SDE"})
    assert r.status_code == 403


def test_student_cannot_mark_attendance(client, as_role):
    h = as_role("student")
    r = client.post(
        "/attendance/bulk",
        headers=h,
        json={"batch_id": "b1", "date": "2026-01-05", "records": [{"student_id": "s1", "status": "present"}]},
    )
    assert r.status_code == 403


def test_dean_creates_drive_and_forwards_user_jwt(client, as_role, respx_mock):
    h = as_role("dean", "dean-1")
    route = respx_mock.post(f"{REST}/company_drives").respond(
        201,
        json=[{"id": "d1", "company_name": "Acme", "role_offered": "SDE", "eligible_departments": ["CSE"],
               "drive_date": "2030-01-01", "uploaded_by": "dean-1"}],
    )
    r = client.post(
        "/drives",
        headers=h,
        json={"company_name": "Acme", "role_offered": "SDE", "eligible_departments": ["CSE"], "drive_date": "2030-01-01"},
    )
    assert r.status_code == 201, r.text
    req = route.calls.last.request
    # Queries run as the user (RLS applies), never with the service key.
    assert req.headers["authorization"] == h["Authorization"]
    assert json.loads(req.content)["uploaded_by"] == "dean-1"


def test_student_drive_list_marks_applied_and_eligibility(client, as_role, respx_mock):
    h = as_role("student", "stu-1")
    respx_mock.get(f"{REST}/company_drives").respond(json=[
        {"id": "d1", "company_name": "A", "role_offered": "SDE", "eligible_departments": []},
        {"id": "d2", "company_name": "B", "role_offered": "QA", "eligible_departments": ["ECE"]},
    ])
    respx_mock.get(f"{REST}/student_profiles").respond(json=[{"department": "CSE"}])
    respx_mock.get(f"{REST}/drive_applications").respond(json=[{"id": "a1", "drive_id": "d1"}])
    r = client.get("/drives", headers=h)
    assert r.status_code == 200
    by_id = {d["id"]: d for d in r.json()}
    assert by_id["d1"]["applied"] and by_id["d1"]["application_id"] == "a1"
    assert by_id["d2"]["eligible"] is False
    r = client.get("/drives?eligible_only=true", headers=h)
    assert [d["id"] for d in r.json()] == ["d1"]


def test_apply_rejects_ineligible_department(client, as_role, respx_mock):
    h = as_role("student", "stu-1")
    respx_mock.get(f"{REST}/company_drives").respond(
        json=[{"id": "d2", "company_name": "B", "role_offered": "QA", "eligible_departments": ["ECE"]}]
    )
    respx_mock.get(f"{REST}/student_profiles").respond(
        json=[{"user_id": "stu-1", "roll_no": "1", "department": "CSE", "is_fastrack": True}]
    )
    assert client.post("/drives/d2/apply", headers=h).status_code == 403


def test_duplicate_application_is_conflict(client, as_role, respx_mock):
    h = as_role("student", "stu-1")
    respx_mock.get(f"{REST}/company_drives").respond(
        json=[{"id": "d1", "company_name": "A", "role_offered": "SDE", "eligible_departments": []}]
    )
    respx_mock.get(f"{REST}/student_profiles").respond(
        json=[{"user_id": "stu-1", "roll_no": "1", "department": "CSE", "is_fastrack": True}]
    )
    respx_mock.post(f"{REST}/drive_applications").respond(409, json={"code": "23505", "message": "duplicate"})
    assert client.post("/drives/d1/apply", headers=h).status_code == 409


def test_faculty_outside_batch_forbidden(client, as_role, respx_mock):
    h = as_role("faculty", "fac-1")
    respx_mock.get(f"{REST}/faculty_batch_map").respond(json=[])
    r = client.get("/attendance/batch/b9?date=2026-01-05", headers=h)
    assert r.status_code == 403


def test_bulk_attendance_rejects_students_outside_batch(client, as_role, respx_mock):
    h = as_role("faculty", "fac-1")
    respx_mock.get(f"{REST}/faculty_batch_map").respond(json=[{"id": "m1"}])
    respx_mock.get(f"{REST}/student_profiles").respond(
        json=[{"user_id": "s1", "roll_no": "1", "department": "CSE", "batch_id": "b1", "profile": {"full_name": "S1"}}]
    )
    r = client.post(
        "/attendance/bulk",
        headers=h,
        json={"batch_id": "b1", "date": "2026-01-05",
              "records": [{"student_id": "s1", "status": "present"}, {"student_id": "intruder", "status": "absent"}]},
    )
    assert r.status_code == 400


def test_bulk_attendance_upserts(client, as_role, respx_mock):
    h = as_role("faculty", "fac-1")
    respx_mock.get(f"{REST}/faculty_batch_map").respond(json=[{"id": "m1"}])
    respx_mock.get(f"{REST}/student_profiles").respond(
        json=[{"user_id": "s1", "roll_no": "1", "department": "CSE", "batch_id": "b1", "profile": {"full_name": "S1"}}]
    )
    route = respx_mock.post(f"{REST}/attendance").respond(201, json=[{"id": "x"}])
    r = client.post(
        "/attendance/bulk",
        headers=h,
        json={"batch_id": "b1", "date": "2026-01-05", "records": [{"student_id": "s1", "status": "leave"}]},
    )
    assert r.json() == {"saved": 1}
    req: httpx.Request = route.calls.last.request
    assert req.url.params["on_conflict"] == "student_id,date"
    assert "resolution=merge-duplicates" in req.headers["prefer"]
    assert json.loads(req.content)[0]["faculty_id"] == "fac-1"


def test_log_stage_validates_stage(client, as_role):
    h = as_role("faculty")
    r = client.post("/applications/a1/stages", headers=h, json={"stage": "hired-lol"})
    assert r.status_code == 422


def test_analytics_funnel(client, as_role, respx_mock):
    h = as_role("dean")
    respx_mock.get(f"{REST}/batch_attendance_summary").respond(json=[
        {"batch_id": "b1", "batch_name": "2026 CSE-A", "department": "CSE", "year": 2026, "student_count": 3,
         "total_marked": 10, "present_count": 8, "absent_count": 1, "leave_count": 1, "attendance_pct": 80.0}
    ])
    respx_mock.get(f"{REST}/application_stage_counts").respond(json=[
        {"stage": "applied", "count": 5}, {"stage": "round1_completed", "count": 2},
        {"stage": "offered", "count": 1}, {"stage": "rejected", "count": 2},
    ])
    respx_mock.get(f"{REST}/company_drives").respond(json=[{"id": "d1"}])
    r = client.get("/analytics", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    funnel = {s["stage"]: s["count"] for s in body["funnel"]}
    assert funnel == {"applied": 10, "shortlisted": 3, "round1_completed": 3, "hr_round": 1, "offered": 1}
    assert body["totals"]["offers"] == 1


def test_faculty_cannot_read_analytics(client, as_role):
    assert client.get("/analytics", headers=as_role("faculty")).status_code == 403
