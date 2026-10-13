export type Role = 'student' | 'faculty' | 'dean' | 'admin'
export type AttendanceStatus = 'present' | 'absent' | 'leave'

export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at?: string
}

export interface StudentProfile {
  user_id: string
  roll_no: string
  department: string
  batch_id: string | null
  is_fastrack: boolean
}

export interface Batch {
  id: string
  name: string
  department: string
  year: number
  created_at?: string
}

export interface Me {
  profile: Profile
  email: string | null
  student: StudentProfile | null
  batch: Batch | null
  assigned_batches: Batch[]
}

export interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  status: AttendanceStatus
  remarks: string | null
}

export interface AttendanceSummary {
  total_marked: number
  present_count: number
  absent_count: number
  leave_count: number
  attendance_pct: number
}

export interface MyAttendance {
  summary: AttendanceSummary
  records: AttendanceRecord[]
}

export interface RosterEntry {
  student_id: string
  full_name: string
  roll_no: string
  status: AttendanceStatus | null
  remarks: string | null
}

export interface BatchRoster {
  batch_id: string
  date: string
  entries: RosterEntry[]
}

export interface BatchStudent {
  user_id: string
  full_name: string
  roll_no: string
  department: string
  batch_id: string | null
  is_fastrack: boolean
}

export interface Drive {
  id: string
  company_name: string
  role_offered: string
  ctc: string | null
  eligibility_criteria: string | null
  eligible_departments: string[]
  drive_date: string | null
  created_at?: string
  applied: boolean
  application_id: string | null
  eligible: boolean
  application_count: number | null
}

export type DriveInput = Pick<
  Drive,
  'company_name' | 'role_offered' | 'ctc' | 'eligibility_criteria' | 'eligible_departments' | 'drive_date'
>

export interface StatusLogEntry {
  id: string
  application_id: string
  updated_by: string | null
  stage: string
  remarks: string | null
  /** Optional 1–5 performance rating from faculty. */
  rating?: number | null
  updated_at: string | null
  updater_name?: string | null
}

export interface Application {
  id: string
  drive_id: string
  student_id: string
  applied_at: string | null
  current_stage: string
  drive: Pick<Drive, 'id' | 'company_name' | 'role_offered' | 'ctc' | 'drive_date'> | null
  student_name: string | null
  roll_no: string | null
  batch_id: string | null
  history: StatusLogEntry[]
}

export interface FacultyAssignment {
  id: string
  faculty_id: string
  faculty_name: string | null
  batch_id: string
  batch_name: string | null
  assigned_at: string | null
}

export interface UserRow {
  id: string
  full_name: string
  role: Role
  created_at?: string
  student: StudentProfile | null
}

export interface StudentDetails {
  roll_no: string
  department: string
  batch_id: string | null
  is_fastrack: boolean
}

export interface BatchAttendanceStat {
  batch_id: string
  batch_name: string
  department: string
  year: number
  student_count: number
  total_marked: number
  present_count: number
  absent_count: number
  leave_count: number
  attendance_pct: number
}

/** Last 7 days vs the 7 days before. */
export interface TrendPair {
  current: number
  previous: number
}

export interface Analytics {
  totals: Record<'batches' | 'students' | 'drives' | 'applications' | 'offers', number>
  trends?: Partial<Record<'attendance_pct' | 'applications' | 'offers', TrendPair>>
  batch_attendance: BatchAttendanceStat[]
  funnel: { stage: string; count: number }[]
  stage_counts: { stage: string; count: number }[]
}
