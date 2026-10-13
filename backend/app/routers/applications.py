from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import CurrentUser, FacultyAndStaff, require_role
from app.models.schemas import STAGES, Application, StageUpdate, StatusLogEntry
from app.routers.batches import ensure_batch_access, fetch_batch_students

router = APIRouter(prefix="/applications", tags=["applications"])

_SELECT = (
    "*,"
    "drive:company_drives(id,company_name,role_offered,ctc,drive_date),"
    "student:profiles(full_name,sp:student_profiles(roll_no,batch_id)),"
    "history:interview_status_log(*)"
)


def _to_application(row: dict) -> Application:
    student = row.pop("student", None) or {}
    sp = student.get("sp") or {}
    history = sorted(row.pop("history", None) or [], key=lambda h: h.get("updated_at") or "")
    return Application(
        **row,
        student_name=student.get("full_name"),
        roll_no=sp.get("roll_no"),
        batch_id=sp.get("batch_id"),
        history=[StatusLogEntry(**h) for h in history],
    )


@router.get("/stages", response_model=list[str])
async def list_stages() -> list[str]:
    return STAGES


@router.get("/me", response_model=list[Application])
async def my_applications(user: CurrentUser = Depends(require_role(["student"]))) -> list[Application]:
    rows = await user.db.select(
        "drive_applications",
        {"student_id": f"eq.{user.id}", "select": _SELECT, "order": "applied_at.desc"},
    )
    return [_to_application(r) for r in rows]


@router.get("", response_model=list[Application])
async def list_applications(
    batch_id: str | None = Query(None),
    drive_id: str | None = Query(None),
    stage: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    user: CurrentUser = Depends(require_role(FacultyAndStaff)),
) -> list[Application]:
    """Faculty see applications from their batches' students (RLS-enforced)."""
    params = {"select": _SELECT, "order": "applied_at.desc", "limit": str(limit)}
    if batch_id:
        await ensure_batch_access(user, batch_id)
        students = await fetch_batch_students(user, batch_id)
        if not students:
            return []
        params["student_id"] = f"in.({','.join(s.user_id for s in students)})"
    if drive_id:
        params["drive_id"] = f"eq.{drive_id}"
    if stage:
        params["current_stage"] = f"eq.{stage}"
    rows = await user.db.select("drive_applications", params)
    return [_to_application(r) for r in rows]


@router.get("/{application_id}", response_model=Application)
async def get_application(
    application_id: str,
    user: CurrentUser = Depends(require_role(["student", "faculty", "dean", "admin"])),
) -> Application:
    row = await user.db.select_one("drive_applications", {"id": f"eq.{application_id}", "select": _SELECT})
    if row is None:  # RLS hides rows the caller may not see
        raise HTTPException(404, "Application not found")
    return _to_application(row)


@router.post("/{application_id}/stages", response_model=Application, status_code=201)
async def log_stage(
    application_id: str,
    body: StageUpdate,
    user: CurrentUser = Depends(require_role(FacultyAndStaff)),
) -> Application:
    app_row = await user.db.select_one(
        "drive_applications",
        {"id": f"eq.{application_id}", "select": "id,current_stage,student_id"},
    )
    if app_row is None:
        raise HTTPException(404, "Application not found")
    if app_row["current_stage"] in ("offered", "rejected", "withdrawn") and user.role == "faculty":
        raise HTTPException(409, f"Application is closed ({app_row['current_stage']}); ask the dean to reopen")

    # A DB trigger mirrors the new stage onto drive_applications.current_stage.
    await user.db.insert(
        "interview_status_log",
        {
            "application_id": application_id,
            "updated_by": user.id,
            "stage": body.stage,
            "remarks": body.remarks,
        },
    )
    row = await user.db.select_one("drive_applications", {"id": f"eq.{application_id}", "select": _SELECT})
    return _to_application(row)  # type: ignore[arg-type]
