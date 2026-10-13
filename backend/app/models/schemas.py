from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["student", "faculty", "dean", "admin"]
AttendanceStatus = Literal["present", "absent", "leave"]

# Ordered interview pipeline. Terminal stages come last.
STAGES: list[str] = [
    "applied",
    "shortlisted",
    "aptitude_cleared",
    "round1_completed",
    "round2_completed",
    "hr_round",
    "offered",
    "rejected",
    "withdrawn",
]
Stage = Literal[
    "applied",
    "shortlisted",
    "aptitude_cleared",
    "round1_completed",
    "round2_completed",
    "hr_round",
    "offered",
    "rejected",
    "withdrawn",
]


class _Model(BaseModel):
    model_config = ConfigDict(extra="ignore")


# ----------------------------------------------------------------- profiles
class Profile(_Model):
    id: str
    full_name: str
    role: Role
    created_at: datetime | None = None


class StudentProfile(_Model):
    user_id: str
    roll_no: str
    department: str
    batch_id: str | None = None
    is_fastrack: bool = True


class Batch(_Model):
    id: str
    name: str
    department: str
    year: int
    created_by: str | None = None
    created_at: datetime | None = None


class MeResponse(_Model):
    profile: Profile
    email: str | None = None
    student: StudentProfile | None = None
    batch: Batch | None = None
    assigned_batches: list[Batch] = []


# ------------------------------------------------------------------ batches
class BatchCreate(_Model):
    name: str = Field(min_length=1, max_length=80)
    department: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=2000, le=2100)


class BatchUpdate(_Model):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    department: str | None = Field(default=None, min_length=1, max_length=80)
    year: int | None = Field(default=None, ge=2000, le=2100)


class BatchStudent(_Model):
    user_id: str
    full_name: str
    roll_no: str
    department: str
    batch_id: str | None = None
    is_fastrack: bool = True


class FacultyAssignment(_Model):
    id: str
    faculty_id: str
    faculty_name: str | None = None
    batch_id: str
    batch_name: str | None = None
    assigned_by: str | None = None
    assigned_at: datetime | None = None
    active: bool = True


class AssignmentCreate(_Model):
    faculty_id: str
    batch_id: str


# --------------------------------------------------------------- attendance
class AttendanceRecord(_Model):
    id: str
    student_id: str
    faculty_id: str | None = None
    date: date
    status: AttendanceStatus
    remarks: str | None = None
    created_at: datetime | None = None


class AttendanceSummary(_Model):
    total_marked: int = 0
    present_count: int = 0
    absent_count: int = 0
    leave_count: int = 0
    attendance_pct: float = 0.0


class MyAttendance(_Model):
    summary: AttendanceSummary
    records: list[AttendanceRecord]


class RosterEntry(_Model):
    student_id: str
    full_name: str
    roll_no: str
    status: AttendanceStatus | None = None
    remarks: str | None = None


class BatchRoster(_Model):
    batch_id: str
    date: date
    entries: list[RosterEntry]


class AttendanceMark(_Model):
    student_id: str
    status: AttendanceStatus
    remarks: str | None = Field(default=None, max_length=300)


class AttendanceBulk(_Model):
    batch_id: str
    date: date
    records: list[AttendanceMark] = Field(min_length=1, max_length=500)


class BulkResult(_Model):
    saved: int


# ------------------------------------------------------------------- drives
class Drive(_Model):
    id: str
    company_name: str
    role_offered: str
    ctc: str | None = None
    eligibility_criteria: str | None = None
    eligible_departments: list[str] = []
    drive_date: date | None = None
    uploaded_by: str | None = None
    created_at: datetime | None = None
    # Populated for students
    applied: bool = False
    application_id: str | None = None
    eligible: bool = True
    application_count: int | None = None


class DriveCreate(_Model):
    company_name: str = Field(min_length=1, max_length=120)
    role_offered: str = Field(min_length=1, max_length=120)
    ctc: str | None = Field(default=None, max_length=60)
    eligibility_criteria: str | None = Field(default=None, max_length=2000)
    eligible_departments: list[str] = []
    drive_date: date | None = None


class DriveUpdate(_Model):
    company_name: str | None = Field(default=None, min_length=1, max_length=120)
    role_offered: str | None = Field(default=None, min_length=1, max_length=120)
    ctc: str | None = Field(default=None, max_length=60)
    eligibility_criteria: str | None = Field(default=None, max_length=2000)
    eligible_departments: list[str] | None = None
    drive_date: date | None = None


# ------------------------------------------------------------- applications
class StatusLogEntry(_Model):
    id: str
    application_id: str
    updated_by: str | None = None
    stage: str
    remarks: str | None = None
    rating: int | None = None
    updated_at: datetime | None = None
    updater_name: str | None = None


class DriveBrief(_Model):
    id: str
    company_name: str
    role_offered: str
    ctc: str | None = None
    drive_date: date | None = None


class Application(_Model):
    id: str
    drive_id: str
    student_id: str
    applied_at: datetime | None = None
    current_stage: str = "applied"
    drive: DriveBrief | None = None
    student_name: str | None = None
    roll_no: str | None = None
    batch_id: str | None = None
    history: list[StatusLogEntry] = []


class StageUpdate(_Model):
    stage: Stage
    remarks: str | None = Field(default=None, max_length=500)
    rating: int | None = Field(default=None, ge=1, le=5)


# ---------------------------------------------------------------- users
class UserRow(_Model):
    id: str
    full_name: str
    role: Role
    created_at: datetime | None = None
    student: StudentProfile | None = None


class StudentDetails(_Model):
    roll_no: str = Field(min_length=1, max_length=40)
    department: str = Field(min_length=1, max_length=80)
    batch_id: str | None = None
    is_fastrack: bool = True


class UserCreate(_Model):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=1, max_length=120)
    role: Role
    student: StudentDetails | None = None


class UserUpdate(_Model):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    role: Role | None = None
    student: StudentDetails | None = None


# ---------------------------------------------------------------- analytics
class BatchAttendanceStat(_Model):
    batch_id: str
    batch_name: str
    department: str
    year: int
    student_count: int
    total_marked: int
    present_count: int
    absent_count: int
    leave_count: int
    attendance_pct: float


class FunnelStep(_Model):
    stage: str
    count: int


class TrendPair(_Model):
    """Value for the last 7 days vs the 7 days before."""

    current: float
    previous: float


class Analytics(_Model):
    totals: dict[str, int]
    trends: dict[str, TrendPair] = {}
    batch_attendance: list[BatchAttendanceStat]
    funnel: list[FunnelStep]
    stage_counts: list[FunnelStep]
