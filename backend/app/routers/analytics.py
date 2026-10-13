from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.deps import CurrentUser, StaffRoles, require_role
from app.models.schemas import STAGES, Analytics, BatchAttendanceStat, FunnelStep, TrendPair

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
    trends = await _weekly_trends(user)
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
        trends=trends,
    )


def _split_weeks(rows: list[dict], key: str, today: date) -> tuple[float, float]:
    """Sum `key` for the last 7 days and for the 7 days before that."""
    cur = prev = 0.0
    for r in rows:
        age = (today - date.fromisoformat(str(r["day"])[:10])).days
        if 0 <= age < 7:
            cur += float(r[key] or 0)
        elif 7 <= age < 14:
            prev += float(r[key] or 0)
    return cur, prev


def _pct(part: float, whole: float) -> float:
    return round(100 * part / whole, 1) if whole else 0.0


async def _weekly_trends(user: CurrentUser) -> dict[str, TrendPair]:
    """Last 7 days vs the previous 7, from the daily_* rollup views."""
    today = date.today()
    since = {"day": f"gte.{(today - timedelta(days=13)).isoformat()}"}
    att = await user.db.select("daily_attendance", since)
    apps = await user.db.select("daily_applications", since)
    offers = await user.db.select("daily_offers", since)

    present = _split_weeks(att, "present", today)
    total = _split_weeks(att, "total", today)
    app_cur, app_prev = _split_weeks(apps, "applications", today)
    off_cur, off_prev = _split_weeks(offers, "offers", today)
    return {
        "attendance_pct": TrendPair(current=_pct(present[0], total[0]), previous=_pct(present[1], total[1])),
        "applications": TrendPair(current=app_cur, previous=app_prev),
        "offers": TrendPair(current=off_cur, previous=off_prev),
    }
