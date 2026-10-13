from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import CurrentUser, FacultyAndStaff, require_role
from app.models.schemas import (
    AttendanceBulk,
    AttendanceRecord,
    AttendanceSummary,
    BatchRoster,
    BulkResult,
    MyAttendance,
    RosterEntry,
)
from app.routers.batches import ensure_batch_access, fetch_batch_students

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/me", response_model=MyAttendance)
async def my_attendance(
    limit: int = Query(60, ge=1, le=366),
    user: CurrentUser = Depends(require_role(["student"])),
) -> MyAttendance:
    summary_row = await user.db.select_one("student_attendance_summary", {"student_id": f"eq.{user.id}"})
    records = await user.db.select(
        "attendance",
        {"student_id": f"eq.{user.id}", "order": "date.desc", "limit": str(limit)},
    )
    summary = AttendanceSummary(**{k: v for k, v in (summary_row or {}).items() if v is not None})
    return MyAttendance(summary=summary, records=[AttendanceRecord(**r) for r in records])


@router.get("/batch/{batch_id}", response_model=BatchRoster)
async def batch_roster(
    batch_id: str,
    on: date = Query(default_factory=date.today, alias="date"),
    user: CurrentUser = Depends(require_role(FacultyAndStaff)),
) -> BatchRoster:
    """Every student in the batch plus their status for the given day (if marked)."""
    await ensure_batch_access(user, batch_id)
    students = await fetch_batch_students(user, batch_id)
    marks: dict[str, dict] = {}
    if students:
        ids = ",".join(s.user_id for s in students)
        rows = await user.db.select(
            "attendance", {"student_id": f"in.({ids})", "date": f"eq.{on.isoformat()}"}
        )
        marks = {r["student_id"]: r for r in rows}
    return BatchRoster(
        batch_id=batch_id,
        date=on,
        entries=[
            RosterEntry(
                student_id=s.user_id,
                full_name=s.full_name,
                roll_no=s.roll_no,
                status=marks.get(s.user_id, {}).get("status"),
                remarks=marks.get(s.user_id, {}).get("remarks"),
            )
            for s in students
        ],
    )


@router.post("/bulk", response_model=BulkResult)
async def bulk_mark(
    body: AttendanceBulk, user: CurrentUser = Depends(require_role(FacultyAndStaff))
) -> BulkResult:
    if body.date > date.today():
        raise HTTPException(400, "Cannot mark attendance for a future date")
    await ensure_batch_access(user, body.batch_id)
    roster = {s.user_id for s in await fetch_batch_students(user, body.batch_id)}
    outsiders = [r.student_id for r in body.records if r.student_id not in roster]
    if outsiders:
        raise HTTPException(400, f"{len(outsiders)} student(s) are not in this batch")

    payload = [
        {
            "student_id": r.student_id,
            "faculty_id": user.id,
            "date": body.date.isoformat(),
            "status": r.status,
            "remarks": r.remarks,
        }
        for r in body.records
    ]
    rows = await user.db.insert("attendance", payload, upsert_on="student_id,date")
    return BulkResult(saved=len(rows))
