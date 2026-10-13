from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.deps import CurrentUser, FacultyAndStaff, StaffRoles, get_current_user, require_role
from app.models.schemas import (
    AssignmentCreate,
    Batch,
    BatchCreate,
    BatchStudent,
    BatchUpdate,
    FacultyAssignment,
)

router = APIRouter(prefix="/batches", tags=["batches"])


async def ensure_batch_access(user: CurrentUser, batch_id: str) -> None:
    """Faculty may only touch batches they're actively assigned to."""
    if user.is_staff:
        return
    row = await user.db.select_one(
        "faculty_batch_map",
        {"faculty_id": f"eq.{user.id}", "batch_id": f"eq.{batch_id}", "active": "is.true"},
    )
    if row is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not assigned to this batch")


@router.get("", response_model=list[Batch])
async def list_batches(user: CurrentUser = Depends(get_current_user)) -> list[Batch]:
    """Faculty get their assigned batches; everyone else gets all batches."""
    if user.role == "faculty":
        rows = await user.db.select(
            "faculty_batch_map",
            {"faculty_id": f"eq.{user.id}", "active": "is.true", "select": "batch:batches(*)"},
        )
        batches = [Batch(**r["batch"]) for r in rows if r.get("batch")]
        return sorted(batches, key=lambda b: (-b.year, b.name))
    rows = await user.db.select("batches", {"order": "year.desc,name.asc"})
    return [Batch(**r) for r in rows]


@router.post("", response_model=Batch, status_code=201)
async def create_batch(
    body: BatchCreate, user: CurrentUser = Depends(require_role(StaffRoles))
) -> Batch:
    rows = await user.db.insert("batches", {**body.model_dump(), "created_by": user.id})
    return Batch(**rows[0])


@router.patch("/{batch_id}", response_model=Batch)
async def update_batch(
    batch_id: str, body: BatchUpdate, user: CurrentUser = Depends(require_role(StaffRoles))
) -> Batch:
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(400, "Nothing to update")
    rows = await user.db.update("batches", {"id": f"eq.{batch_id}"}, data)
    if not rows:
        raise HTTPException(404, "Batch not found")
    return Batch(**rows[0])


@router.delete("/{batch_id}", status_code=204)
async def delete_batch(batch_id: str, user: CurrentUser = Depends(require_role(StaffRoles))) -> Response:
    rows = await user.db.delete("batches", {"id": f"eq.{batch_id}"})
    if not rows:
        raise HTTPException(404, "Batch not found")
    return Response(status_code=204)


@router.get("/{batch_id}/students", response_model=list[BatchStudent])
async def batch_students(
    batch_id: str, user: CurrentUser = Depends(require_role(FacultyAndStaff))
) -> list[BatchStudent]:
    await ensure_batch_access(user, batch_id)
    return await fetch_batch_students(user, batch_id)


async def fetch_batch_students(user: CurrentUser, batch_id: str) -> list[BatchStudent]:
    rows = await user.db.select(
        "student_profiles",
        {
            "batch_id": f"eq.{batch_id}",
            "select": "*,profile:profiles(full_name)",
            "order": "roll_no.asc",
        },
    )
    return [
        BatchStudent(**r, full_name=(r.get("profile") or {}).get("full_name") or r["roll_no"])
        for r in rows
    ]


# ------------------------------------------------------- faculty assignments
@router.get("/assignments/all", response_model=list[FacultyAssignment])
async def list_assignments(
    user: CurrentUser = Depends(require_role(StaffRoles)),
) -> list[FacultyAssignment]:
    rows = await user.db.select(
        "faculty_batch_map",
        {
            "active": "is.true",
            "select": "*,faculty:profiles!faculty_batch_map_faculty_id_fkey(full_name),batch:batches(name)",
            "order": "assigned_at.desc",
        },
    )
    return [
        FacultyAssignment(
            **r,
            faculty_name=(r.get("faculty") or {}).get("full_name"),
            batch_name=(r.get("batch") or {}).get("name"),
        )
        for r in rows
    ]


@router.post("/assignments", response_model=FacultyAssignment, status_code=201)
async def create_assignment(
    body: AssignmentCreate, user: CurrentUser = Depends(require_role(StaffRoles))
) -> FacultyAssignment:
    fac = await user.db.select_one("profiles", {"id": f"eq.{body.faculty_id}", "select": "role,full_name"})
    if fac is None or fac["role"] != "faculty":
        raise HTTPException(400, "Selected user is not a faculty member")
    existing = await user.db.select_one(
        "faculty_batch_map",
        {"faculty_id": f"eq.{body.faculty_id}", "batch_id": f"eq.{body.batch_id}", "active": "is.true"},
    )
    if existing:
        raise HTTPException(409, "Faculty is already assigned to this batch")
    rows = await user.db.insert(
        "faculty_batch_map",
        {"faculty_id": body.faculty_id, "batch_id": body.batch_id, "assigned_by": user.id, "active": True},
    )
    return FacultyAssignment(**rows[0], faculty_name=fac["full_name"])


@router.delete("/assignments/{assignment_id}", status_code=204)
async def remove_assignment(
    assignment_id: str, user: CurrentUser = Depends(require_role(StaffRoles))
) -> Response:
    # Soft-deactivate to keep an audit trail of past assignments.
    rows = await user.db.update("faculty_batch_map", {"id": f"eq.{assignment_id}"}, {"active": False})
    if not rows:
        raise HTTPException(404, "Assignment not found")
    return Response(status_code=204)
