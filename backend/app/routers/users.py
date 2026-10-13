from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.core.supabase_client import AuthAdmin
from app.deps import CurrentUser, Role, StaffRoles, invalidate_profile_cache, require_role
from app.models.schemas import StudentProfile, UserCreate, UserRow, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _to_user(row: dict) -> UserRow:
    sp = row.pop("student", None)
    if isinstance(sp, list):  # older PostgREST returns 1:1 embeds as arrays
        sp = sp[0] if sp else None
    return UserRow(**row, student=StudentProfile(**sp) if sp else None)


@router.get("", response_model=list[UserRow])
async def list_users(
    role: Role | None = Query(None),
    user: CurrentUser = Depends(require_role(StaffRoles)),
) -> list[UserRow]:
    """Admin manages everyone; the dean uses this to pick faculty for assignments."""
    params = {"select": "*,student:student_profiles(*)", "order": "full_name.asc"}
    if role:
        params["role"] = f"eq.{role}"
    rows = await user.db.select("profiles", params)
    return [_to_user(r) for r in rows]


@router.post("", response_model=UserRow, status_code=201)
async def create_user(body: UserCreate, user: CurrentUser = Depends(require_role(["admin"]))) -> UserRow:
    if body.role == "student" and body.student is None:
        raise HTTPException(400, "Student details (roll no, department) are required for students")
    admin = AuthAdmin()
    created = await admin.create_user(
        email=body.email, password=body.password, full_name=body.full_name, role=body.role
    )
    uid = created["id"]
    try:
        # The on_auth_user_created trigger inserted the profile; make sure it matches.
        await user.db.insert(
            "profiles", {"id": uid, "full_name": body.full_name, "role": body.role}, upsert_on="id"
        )
        if body.role == "student" and body.student:
            await user.db.insert("student_profiles", {"user_id": uid, **body.student.model_dump()})
    except Exception:
        await admin.delete_user(uid)  # roll back the half-created account
        raise
    row = await user.db.select_one("profiles", {"id": f"eq.{uid}", "select": "*,student:student_profiles(*)"})
    return _to_user(row)  # type: ignore[arg-type]


@router.patch("/{user_id}", response_model=UserRow)
async def update_user(
    user_id: str, body: UserUpdate, user: CurrentUser = Depends(require_role(["admin"]))
) -> UserRow:
    if user_id == user.id and body.role and body.role != "admin":
        raise HTTPException(400, "You cannot remove your own admin role")
    data = body.model_dump(exclude_unset=True, exclude={"student"})
    if data:
        rows = await user.db.update("profiles", {"id": f"eq.{user_id}"}, data)
        if not rows:
            raise HTTPException(404, "User not found")
        if "role" in data:
            await AuthAdmin().update_role(user_id, data["role"])
            invalidate_profile_cache(user_id)
    if body.student:
        await user.db.insert(
            "student_profiles", {"user_id": user_id, **body.student.model_dump()}, upsert_on="user_id"
        )
    row = await user.db.select_one("profiles", {"id": f"eq.{user_id}", "select": "*,student:student_profiles(*)"})
    if row is None:
        raise HTTPException(404, "User not found")
    return _to_user(row)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, user: CurrentUser = Depends(require_role(["admin"]))) -> Response:
    if user_id == user.id:
        raise HTTPException(400, "You cannot delete your own account")
    await AuthAdmin().delete_user(user_id)  # cascades to profiles & dependants
    invalidate_profile_cache(user_id)
    return Response(status_code=204)
