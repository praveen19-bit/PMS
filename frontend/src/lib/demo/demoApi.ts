/**
 * Demo-mode implementation of the API client. Mirrors the FastAPI routes,
 * including their role checks and validation, against the in-browser store.
 */
import { ApiError } from '@/lib/errors'
import { todayISO } from '@/lib/format'
import type {
  Analytics, Application, AttendanceStatus, Batch, BatchRoster, BatchStudent, Drive, DriveInput,
  FacultyAssignment, Me, MyAttendance, Role, StudentDetails, UserRow,
} from '@/lib/types'
import { getDemoUserId } from './auth'
import { db, mutate, uid, type DApplication, type DDrive } from './store'

const STAGES = ['applied', 'shortlisted', 'aptitude_cleared', 'round1_completed', 'round2_completed', 'hr_round', 'offered', 'rejected', 'withdrawn']
const CLOSED = ['offered', 'rejected', 'withdrawn']
const FUNNEL = ['applied', 'shortlisted', 'round1_completed', 'hr_round', 'offered']
const PROGRESS = STAGES.slice(0, STAGES.indexOf('offered') + 1)

// A short delay so loading states behave like the real app.
const respond = <T,>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) => setTimeout(() => {
    try { resolve(structuredClone(fn())) } catch (e) { reject(e) }
  }, 120))

const fail = (status: number, msg: string): never => { throw new ApiError(status, msg) }

function caller(...roles: Role[]) {
  const id = getDemoUserId() ?? fail(401, 'Please sign in again.')
  const p = db().profiles.find((x) => x.id === id) ?? fail(401, 'Please sign in again.')
  if (roles.length && !roles.includes(p.role)) fail(403, `Requires role: ${roles.join(', ')}`)
  return p
}
const isStaff = (role: Role) => role === 'dean' || role === 'admin'

const assignedBatchIds = (facultyId: string) =>
  db().assignments.filter((a) => a.active && a.faculty_id === facultyId).map((a) => a.batch_id)

function ensureBatchAccess(user: { id: string; role: Role }, batchId: string) {
  if (!isStaff(user.role) && !assignedBatchIds(user.id).includes(batchId)) fail(403, 'You are not assigned to this batch')
}

function studentsOf(batchId: string): BatchStudent[] {
  const d = db()
  return d.student_profiles
    .filter((s) => s.batch_id === batchId)
    .sort((a, b) => a.roll_no.localeCompare(b.roll_no))
    .map((s) => ({ ...s, full_name: d.profiles.find((p) => p.id === s.user_id)?.full_name ?? s.roll_no }))
}

/** Students a caller may see (RLS equivalent). */
function visibleStudentIds(user: { id: string; role: Role }): Set<string> {
  if (isStaff(user.role)) return new Set(db().student_profiles.map((s) => s.user_id))
  if (user.role === 'student') return new Set([user.id])
  const batches = assignedBatchIds(user.id)
  return new Set(db().student_profiles.filter((s) => s.batch_id && batches.includes(s.batch_id)).map((s) => s.user_id))
}

const byYearName = (a: Batch, b: Batch) => b.year - a.year || a.name.localeCompare(b.name)

function toApplication(a: DApplication): Application {
  const d = db()
  const drive = d.drives.find((x) => x.id === a.drive_id)
  const sp = d.student_profiles.find((s) => s.user_id === a.student_id)
  return {
    ...a,
    drive: drive ? { id: drive.id, company_name: drive.company_name, role_offered: drive.role_offered, ctc: drive.ctc, drive_date: drive.drive_date } : null,
    student_name: d.profiles.find((p) => p.id === a.student_id)?.full_name ?? null,
    roll_no: sp?.roll_no ?? null,
    batch_id: sp?.batch_id ?? null,
    history: d.logs.filter((l) => l.application_id === a.id).sort((x, y) => (x.updated_at ?? '').localeCompare(y.updated_at ?? '')),
  }
}

const eligible = (drive: DDrive, dept?: string) =>
  !drive.eligible_departments.length || drive.eligible_departments.map((x) => x.toLowerCase()).includes((dept ?? '').toLowerCase())

function toDrive(d: DDrive): Drive {
  return { ...d, applied: false, application_id: null, eligible: true, application_count: null }
}

function userRow(id: string): UserRow {
  const d = db()
  const p = d.profiles.find((x) => x.id === id) ?? fail(404, 'User not found')
  return { ...p, student: d.student_profiles.find((s) => s.user_id === id) ?? null }
}

function validateStudent(s: StudentDetails, userId?: string) {
  if (!s.roll_no.trim() || !s.department.trim()) fail(422, 'Roll number and department are required')
  if (db().student_profiles.some((x) => x.roll_no === s.roll_no && x.user_id !== userId)) fail(409, 'Roll number already in use')
}

export const demoApi = {
  me: () => respond<Me>(() => {
    const u = caller()
    const d = db()
    const student = d.student_profiles.find((s) => s.user_id === u.id) ?? null
    return {
      profile: u,
      email: d.accounts.find((a) => a.user_id === u.id)?.email ?? null,
      student,
      batch: d.batches.find((b) => b.id === student?.batch_id) ?? null,
      assigned_batches: u.role === 'faculty' ? d.batches.filter((b) => assignedBatchIds(u.id).includes(b.id)).sort(byYearName) : [],
    }
  }),

  // ---------------------------------------------------------------- batches
  batches: () => respond<Batch[]>(() => {
    const u = caller()
    const all = [...db().batches].sort(byYearName)
    return u.role === 'faculty' ? all.filter((b) => assignedBatchIds(u.id).includes(b.id)) : all
  }),
  createBatch: (b: Omit<Batch, 'id'>) => respond<Batch>(() => {
    caller('dean', 'admin')
    const batch: Batch = { ...b, id: uid('b'), created_at: new Date().toISOString() }
    mutate((d) => d.batches.push(batch))
    return batch
  }),
  updateBatch: (id: string, b: Partial<Batch>) => respond<Batch>(() => {
    caller('dean', 'admin')
    return mutate((d) => {
      const batch = d.batches.find((x) => x.id === id) ?? fail(404, 'Batch not found')
      return Object.assign(batch, b, { id })
    })
  }),
  deleteBatch: (id: string) => respond<void>(() => {
    caller('dean', 'admin')
    mutate((d) => {
      if (!d.batches.some((x) => x.id === id)) fail(404, 'Batch not found')
      d.batches = d.batches.filter((x) => x.id !== id)
      d.assignments = d.assignments.filter((a) => a.batch_id !== id)
      d.student_profiles.forEach((s) => { if (s.batch_id === id) s.batch_id = null })
    })
  }),
  batchStudents: (id: string) => respond<BatchStudent[]>(() => {
    const u = caller('faculty', 'dean', 'admin')
    ensureBatchAccess(u, id)
    return studentsOf(id)
  }),
  assignments: () => respond<FacultyAssignment[]>(() => {
    caller('dean', 'admin')
    const d = db()
    return d.assignments.filter((a) => a.active).map((a) => ({
      ...a,
      faculty_name: d.profiles.find((p) => p.id === a.faculty_id)?.full_name ?? null,
      batch_name: d.batches.find((b) => b.id === a.batch_id)?.name ?? null,
    }))
  }),
  assign: (faculty_id: string, batch_id: string) => respond<FacultyAssignment>(() => {
    caller('dean', 'admin')
    return mutate((d) => {
      const fac = d.profiles.find((p) => p.id === faculty_id)
      if (fac?.role !== 'faculty') fail(400, 'Selected user is not a faculty member')
      if (d.assignments.some((a) => a.active && a.faculty_id === faculty_id && a.batch_id === batch_id)) fail(409, 'Faculty is already assigned to this batch')
      const a = { id: uid('fbm'), faculty_id, batch_id, assigned_at: new Date().toISOString(), active: true }
      d.assignments.push(a)
      return { ...a, faculty_name: fac!.full_name, batch_name: d.batches.find((b) => b.id === batch_id)?.name ?? null }
    })
  }),
  unassign: (id: string) => respond<void>(() => {
    caller('dean', 'admin')
    mutate((d) => {
      const a = d.assignments.find((x) => x.id === id) ?? fail(404, 'Assignment not found')
      a.active = false
    })
  }),

  // ------------------------------------------------------------- attendance
  myAttendance: () => respond<MyAttendance>(() => {
    const u = caller('student')
    const rows = db().attendance.filter((a) => a.student_id === u.id).sort((a, b) => b.date.localeCompare(a.date))
    const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length
    const present = count('present')
    return {
      summary: {
        total_marked: rows.length, present_count: present, absent_count: count('absent'), leave_count: count('leave'),
        attendance_pct: rows.length ? Math.round((1000 * present) / rows.length) / 10 : 0,
      },
      records: rows.slice(0, 60),
    }
  }),
  roster: (batchId: string, date: string) => respond<BatchRoster>(() => {
    const u = caller('faculty', 'dean', 'admin')
    ensureBatchAccess(u, batchId)
    const att = db().attendance.filter((a) => a.date === date)
    return {
      batch_id: batchId,
      date,
      entries: studentsOf(batchId).map((s) => {
        const m = att.find((a) => a.student_id === s.user_id)
        return { student_id: s.user_id, full_name: s.full_name, roll_no: s.roll_no, status: m?.status ?? null, remarks: m?.remarks ?? null }
      }),
    }
  }),
  saveAttendance: (batch_id: string, date: string, records: { student_id: string; status: AttendanceStatus }[]) =>
    respond<{ saved: number }>(() => {
      const u = caller('faculty', 'dean', 'admin')
      if (date > todayISO()) fail(400, 'Cannot mark attendance for a future date')
      ensureBatchAccess(u, batch_id)
      const roster = new Set(studentsOf(batch_id).map((s) => s.user_id))
      if (records.some((r) => !roster.has(r.student_id))) fail(400, 'Some students are not in this batch')
      mutate((d) => {
        for (const r of records) {
          const existing = d.attendance.find((a) => a.student_id === r.student_id && a.date === date)
          if (existing) Object.assign(existing, { status: r.status, faculty_id: u.id })
          else d.attendance.push({ id: uid('att'), student_id: r.student_id, faculty_id: u.id, date, status: r.status, remarks: null })
        }
      })
      return { saved: records.length }
    }),

  // ----------------------------------------------------------------- drives
  drives: (opts: { upcoming?: boolean; eligible_only?: boolean } = {}) => respond<Drive[]>(() => {
    const u = caller()
    const d = db()
    const today = todayISO()
    const rows = [...d.drives]
      .filter((x) => !opts.upcoming || !x.drive_date || x.drive_date >= today)
      .sort((a, b) => (a.drive_date ?? '9999').localeCompare(b.drive_date ?? '9999'))
    if (u.role === 'student') {
      const dept = d.student_profiles.find((s) => s.user_id === u.id)?.department
      const mine = new Map(d.applications.filter((a) => a.student_id === u.id).map((a) => [a.drive_id, a.id]))
      const list = rows.map((x) => ({ ...toDrive(x), applied: mine.has(x.id), application_id: mine.get(x.id) ?? null, eligible: eligible(x, dept) }))
      return opts.eligible_only ? list.filter((x) => x.eligible) : list
    }
    return rows.map((x) => ({
      ...toDrive(x),
      application_count: isStaff(u.role) ? d.applications.filter((a) => a.drive_id === x.id).length : null,
    }))
  }),
  createDrive: (input: DriveInput) => respond<Drive>(() => {
    caller('dean', 'admin')
    const drive: DDrive = { ...input, id: uid('d'), created_at: new Date().toISOString() }
    mutate((d) => d.drives.push(drive))
    return { ...toDrive(drive), application_count: 0 }
  }),
  updateDrive: (id: string, input: Partial<DriveInput>) => respond<Drive>(() => {
    caller('dean', 'admin')
    return toDrive(mutate((d) => Object.assign(d.drives.find((x) => x.id === id) ?? fail(404, 'Drive not found'), input)))
  }),
  deleteDrive: (id: string) => respond<void>(() => {
    caller('dean', 'admin')
    mutate((d) => {
      if (!d.drives.some((x) => x.id === id)) fail(404, 'Drive not found')
      const apps = new Set(d.applications.filter((a) => a.drive_id === id).map((a) => a.id))
      d.drives = d.drives.filter((x) => x.id !== id)
      d.applications = d.applications.filter((a) => !apps.has(a.id))
      d.logs = d.logs.filter((l) => !apps.has(l.application_id))
    })
  }),
  apply: (driveId: string) => respond<Application>(() => {
    const u = caller('student')
    return mutate((d) => {
      const drive = d.drives.find((x) => x.id === driveId) ?? fail(404, 'Drive not found')
      if (drive.drive_date && drive.drive_date < todayISO()) fail(400, 'This drive has already taken place')
      const sp = d.student_profiles.find((s) => s.user_id === u.id) ?? fail(400, 'Your student profile is incomplete — contact the placement cell')
      if (!sp.is_fastrack) fail(403, 'Only fastrack students can apply through this portal')
      if (!eligible(drive, sp.department)) fail(403, 'Your department is not eligible for this drive')
      if (d.applications.some((a) => a.drive_id === driveId && a.student_id === u.id)) fail(409, 'You have already applied to this drive')
      const app: DApplication = { id: uid('app'), drive_id: driveId, student_id: u.id, applied_at: new Date().toISOString(), current_stage: 'applied' }
      d.applications.push(app)
      return toApplication(app)
    })
  }),

  // ----------------------------------------------------------- applications
  stages: () => respond<string[]>(() => STAGES),
  myApplications: () => respond<Application[]>(() => {
    const u = caller('student')
    return db().applications.filter((a) => a.student_id === u.id)
      .sort((a, b) => b.applied_at.localeCompare(a.applied_at)).map(toApplication)
  }),
  applications: (opts: { batch_id?: string; drive_id?: string; stage?: string } = {}) => respond<Application[]>(() => {
    const u = caller('faculty', 'dean', 'admin')
    let ids = visibleStudentIds(u)
    if (opts.batch_id) {
      ensureBatchAccess(u, opts.batch_id)
      const inBatch = new Set(studentsOf(opts.batch_id).map((s) => s.user_id))
      ids = new Set([...ids].filter((x) => inBatch.has(x)))
    }
    return db().applications
      .filter((a) => ids.has(a.student_id))
      .filter((a) => !opts.drive_id || a.drive_id === opts.drive_id)
      .filter((a) => !opts.stage || a.current_stage === opts.stage)
      .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
      .map(toApplication)
  }),
  logStage: (id: string, stage: string, remarks?: string) => respond<Application>(() => {
    const u = caller('faculty', 'dean', 'admin')
    if (!STAGES.includes(stage)) fail(422, 'Unknown stage')
    return mutate((d) => {
      const app = d.applications.find((a) => a.id === id)
      if (!app || !visibleStudentIds(u).has(app.student_id)) fail(404, 'Application not found')
      if (u.role === 'faculty' && CLOSED.includes(app!.current_stage)) fail(409, `Application is closed (${app!.current_stage}); ask the dean to reopen`)
      d.logs.push({ id: uid('log'), application_id: id, updated_by: u.id, stage, remarks: remarks ?? null, updated_at: new Date().toISOString() })
      app!.current_stage = stage
      return toApplication(app!)
    })
  }),

  // ------------------------------------------------------------------ users
  users: (role?: Role) => respond<UserRow[]>(() => {
    caller('dean', 'admin')
    return db().profiles.filter((p) => !role || p.role === role)
      .sort((a, b) => a.full_name.localeCompare(b.full_name)).map((p) => userRow(p.id))
  }),
  createUser: (u: { email: string; password: string; full_name: string; role: Role; student?: StudentDetails }) =>
    respond<UserRow>(() => {
      caller('admin')
      if (u.role === 'student' && !u.student) fail(400, 'Student details (roll no, department) are required for students')
      if (u.password.length < 8) fail(422, 'Password must be at least 8 characters')
      if (db().accounts.some((a) => a.email.toLowerCase() === u.email.toLowerCase())) fail(409, 'A user with this email address has already been registered')
      if (u.student) validateStudent(u.student)
      const id = uid('u')
      mutate((d) => {
        d.profiles.push({ id, full_name: u.full_name, role: u.role, created_at: new Date().toISOString() })
        d.accounts.push({ user_id: id, email: u.email, password: u.password })
        if (u.role === 'student' && u.student) d.student_profiles.push({ user_id: id, ...u.student })
      })
      return userRow(id)
    }),
  updateUser: (id: string, u: { full_name?: string; role?: Role; student?: StudentDetails }) => respond<UserRow>(() => {
    const me = caller('admin')
    if (id === me.id && u.role && u.role !== 'admin') fail(400, 'You cannot remove your own admin role')
    if (u.student) validateStudent(u.student, id)
    mutate((d) => {
      const p = d.profiles.find((x) => x.id === id) ?? fail(404, 'User not found')
      if (u.full_name) p.full_name = u.full_name
      if (u.role) p.role = u.role
      if (u.student) {
        const existing = d.student_profiles.find((s) => s.user_id === id)
        if (existing) Object.assign(existing, u.student)
        else d.student_profiles.push({ user_id: id, ...u.student })
      }
    })
    return userRow(id)
  }),
  deleteUser: (id: string) => respond<void>(() => {
    const me = caller('admin')
    if (id === me.id) fail(400, 'You cannot delete your own account')
    mutate((d) => {
      if (!d.profiles.some((p) => p.id === id)) fail(404, 'User not found')
      const apps = new Set(d.applications.filter((a) => a.student_id === id).map((a) => a.id))
      d.profiles = d.profiles.filter((p) => p.id !== id)
      d.accounts = d.accounts.filter((a) => a.user_id !== id)
      d.student_profiles = d.student_profiles.filter((s) => s.user_id !== id)
      d.assignments = d.assignments.filter((a) => a.faculty_id !== id)
      d.attendance = d.attendance.filter((a) => a.student_id !== id)
      d.applications = d.applications.filter((a) => !apps.has(a.id))
      d.logs = d.logs.filter((l) => !apps.has(l.application_id))
    })
  }),

  // -------------------------------------------------------------- analytics
  analytics: () => respond<Analytics>(() => {
    caller('dean', 'admin')
    const d = db()
    const batch_attendance = [...d.batches].sort(byYearName).map((b) => {
      const ids = new Set(d.student_profiles.filter((s) => s.batch_id === b.id).map((s) => s.user_id))
      const rows = d.attendance.filter((a) => ids.has(a.student_id))
      const n = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length
      return {
        batch_id: b.id, batch_name: b.name, department: b.department, year: b.year, student_count: ids.size,
        total_marked: rows.length, present_count: n('present'), absent_count: n('absent'), leave_count: n('leave'),
        attendance_pct: rows.length ? Math.round((1000 * n('present')) / rows.length) / 10 : 0,
      }
    })
    const byStage = new Map<string, number>()
    d.applications.forEach((a) => byStage.set(a.current_stage, (byStage.get(a.current_stage) ?? 0) + 1))
    const total = d.applications.length
    const funnel = FUNNEL.map((stage) => ({
      stage,
      count: stage === 'applied' ? total : PROGRESS.slice(PROGRESS.indexOf(stage)).reduce((sum, s) => sum + (byStage.get(s) ?? 0), 0),
    }))
    return {
      totals: {
        batches: d.batches.length,
        students: batch_attendance.reduce((s, b) => s + b.student_count, 0),
        drives: d.drives.length,
        applications: total,
        offers: byStage.get('offered') ?? 0,
      },
      batch_attendance,
      funnel,
      stage_counts: STAGES.map((stage) => ({ stage, count: byStage.get(stage) ?? 0 })),
    }
  }),
}
