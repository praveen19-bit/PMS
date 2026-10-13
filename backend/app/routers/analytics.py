from fastapi import APIRouter, Depends

from app.deps import CurrentUser, StaffRoles, require_role
from app.models.schemas import STAGES, Analytics, BatchAttendanceStat, FunnelStep

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Funnel steps: an application "reached" a step if its current stage is at or
# beyond it in the pipeline. Rejected/withdrawn only count toward "applied",
# since we don't know how far they progressed from current_stage alone.
_FUNNEL = ["applied", "shortlisted", "round1_completed", "hr_round", "offered"]
_PROGRESS = STAGES[: STAGES.index("offered") + 1]


@router.get("", response_model=Analytics)
async def overview(user: CurrentUser = Depends(require_role(StaffRoles))) -> Analytics:
    batch_rows = await user.db.select("batch_attendance_summary", {"order": "year.desc,batch_name.asc"})
    stage_rows = await user.db.select("application_stage_counts")
    drives = await user.db.select("company_drives", {"select": "id"})

    by_stage = {r["stage"] or "applied": int(r["count"]) for r in stage_rows}
    total_apps = sum(by_stage.values())
    funnel = []
    for step in _FUNNEL:
        if step == "applied":
            funnel.append(FunnelStep(stage=step, count=total_apps))
            continue
        idx = _PROGRESS.index(step)
        funnel.append(
            FunnelStep(stage=step, count=sum(by_stage.get(s, 0) for s in _PROGRESS[idx:]))
        )

    batch_attendance = [BatchAttendanceStat(**r) for r in batch_rows]
    return Analytics(
        totals={
            "batches": len(batch_rows),
            "students": sum(b.student_count for b in batch_attendance),
            "drives": len(drives),
            "applications": total_apps,
            "offers": by_stage.get("offered", 0),
        },
        batch_attendance=batch_attendance,
        funnel=funnel,
        stage_counts=[FunnelStep(stage=s, count=by_stage.get(s, 0)) for s in STAGES],
    )
