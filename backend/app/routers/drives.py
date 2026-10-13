from collections import Counter
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.deps import CurrentUser, StaffRoles, get_current_user, require_role
from app.models.schemas import Application, Drive, DriveCreate, DriveUpdate

router = APIRouter(prefix="/drives", tags=["drives"])


def _is_eligible(drive: dict, department: str | None) -> bool:
    depts = [d.lower() for d in (drive.get("eligible_departments") or [])]
    return not depts or (department or "").lower() in depts


@router.get("", response_model=list[Drive])
async def list_drives(
    upcoming: bool = Query(False, description="Only drives dated today or later (or undated)"),
    eligible_only: bool = Query(False, description="Students: only drives matching their department"),
    user: CurrentUser = Depends(get_current_user),
) -> list[Drive]:
    params = {"order": "drive_date.asc.nullslast,created_at.desc"}
    if upcoming:
        params["or"] = f"(drive_date.gte.{date.today().isoformat()},drive_date.is.null)"
    rows = await user.db.select("company_drives", params)

    if user.role == "student":
        sp = await user.db.select_one("student_profiles", {"user_id": f"eq.{user.id}", "select": "department"})
        dept = sp["department"] if sp else None
        apps = await user.db.select(
            "drive_applications", {"student_id": f"eq.{user.id}", "select": "id,drive_id"}
        )
        applied = {a["drive_id"]: a["id"] for a in apps}
        drives = [
            Drive(
                **r,
                applied=r["id"] in applied,
                application_id=applied.get(r["id"]),
                eligible=_is_eligible(r, dept),
            )
            for r in rows
        ]
        return [d for d in drives if d.eligible] if eligible_only else drives

    counts: Counter[str] = Counter()
    if user.role in ("dean", "admin"):
        stats = await user.db.select("drive_application_counts")
        counts = Counter({s["drive_id"]: s["application_count"] for s in stats})
    return [Drive(**r, application_count=counts.get(r["id"], 0)) for r in rows]


@router.get("/{drive_id}", response_model=Drive)
async def get_drive(drive_id: str, user: CurrentUser = Depends(get_current_user)) -> Drive:
    row = await user.db.select_one("company_drives", {"id": f"eq.{drive_id}"})
    if row is None:
        raise HTTPException(404, "Drive not found")
    return Drive(**row)


@router.post("", response_model=Drive, status_code=201)
async def create_drive(body: DriveCreate, user: CurrentUser = Depends(require_role(StaffRoles))) -> Drive:
    rows = await user.db.insert(
        "company_drives", {**body.model_dump(mode="json"), "uploaded_by": user.id}
    )
    return Drive(**rows[0])


@router.patch("/{drive_id}", response_model=Drive)
async def update_drive(
    drive_id: str, body: DriveUpdate, user: CurrentUser = Depends(require_role(StaffRoles))
) -> Drive:
    data = body.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(400, "Nothing to update")
    rows = await user.db.update("company_drives", {"id": f"eq.{drive_id}"}, data)
    if not rows:
        raise HTTPException(404, "Drive not found")
    return Drive(**rows[0])


@router.delete("/{drive_id}", status_code=204)
async def delete_drive(drive_id: str, user: CurrentUser = Depends(require_role(StaffRoles))) -> Response:
    rows = await user.db.delete("company_drives", {"id": f"eq.{drive_id}"})
    if not rows:
        raise HTTPException(404, "Drive not found")
    return Response(status_code=204)


@router.post("/{drive_id}/apply", response_model=Application, status_code=201)
async def apply_to_drive(
    drive_id: str, user: CurrentUser = Depends(require_role(["student"]))
) -> Application:
    drive = await user.db.select_one("company_drives", {"id": f"eq.{drive_id}"})
    if drive is None:
        raise HTTPException(404, "Drive not found")
    if drive.get("drive_date") and date.fromisoformat(drive["drive_date"]) < date.today():
        raise HTTPException(400, "This drive has already taken place")
    sp = await user.db.select_one("student_profiles", {"user_id": f"eq.{user.id}"})
    if sp is None:
        raise HTTPException(400, "Your student profile is incomplete — contact the placement cell")
    if not sp.get("is_fastrack", True):
        raise HTTPException(403, "Only fastrack students can apply through this portal")
    if not _is_eligible(drive, sp.get("department")):
        raise HTTPException(403, "Your department is not eligible for this drive")

    rows = await user.db.insert(
        "drive_applications",
        {"drive_id": drive_id, "student_id": user.id, "current_stage": "applied"},
    )
    return Application(**rows[0])
