from fastapi import APIRouter, Depends

from app.deps import CurrentUser, get_current_user
from app.models.schemas import Batch, MeResponse, Profile, StudentProfile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=MeResponse)
async def me(user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    """Session check: returns the caller's profile plus role-specific context."""
    profile = await user.db.select_one("profiles", {"id": f"eq.{user.id}"})
    resp = MeResponse(profile=Profile(**profile), email=user.email)  # type: ignore[arg-type]

    if user.role == "student":
        sp = await user.db.select_one("student_profiles", {"user_id": f"eq.{user.id}"})
        if sp:
            resp.student = StudentProfile(**sp)
            if sp.get("batch_id"):
                b = await user.db.select_one("batches", {"id": f"eq.{sp['batch_id']}"})
                resp.batch = Batch(**b) if b else None
    elif user.role == "faculty":
        rows = await user.db.select(
            "faculty_batch_map",
            {"faculty_id": f"eq.{user.id}", "active": "is.true", "select": "batch:batches(*)"},
        )
        resp.assigned_batches = [Batch(**r["batch"]) for r in rows if r.get("batch")]
    return resp
