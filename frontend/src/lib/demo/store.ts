/**
 * Demo-mode "database": the same tables as Supabase, kept in localStorage so
 * changes survive a page refresh. Seeded with realistic sample data relative to
 * today's date; `resetDemoData()` regenerates it.
 */
import { todayISO } from '@/lib/format'
import type { AttendanceStatus, Batch, Role, StatusLogEntry, StudentProfile } from '@/lib/types'

export interface DProfile { id: string; full_name: string; role: Role; created_at: string }
export interface DAccount { user_id: string; email: string; password: string }
export interface DAssignment { id: string; faculty_id: string; batch_id: string; assigned_at: string; active: boolean }
export interface DAttendance { id: string; student_id: string; faculty_id: string; date: string; status: AttendanceStatus; remarks: string | null }
export interface DDrive {
  id: string; company_name: string; role_offered: string; ctc: string | null; eligibility_criteria: string | null
  eligible_departments: string[]; drive_date: string | null; created_at: string
}
export interface DApplication { id: string; drive_id: string; student_id: string; applied_at: string; current_stage: string }

export interface DemoDB {
  version: number
  profiles: DProfile[]
  accounts: DAccount[]
  student_profiles: StudentProfile[]
  batches: Batch[]
  assignments: DAssignment[]
  attendance: DAttendance[]
  drives: DDrive[]
  applications: DApplication[]
  logs: StatusLogEntry[]
}

const KEY = 'fastrack-demo-db'
const VERSION = 2 // bump to reseed browsers holding older sample data
export const DEMO_PASSWORD = 'demo1234'

let memory: DemoDB | null = null

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const stamp = (iso: string, hour = 10) => new Date(`${iso}T${String(hour).padStart(2, '0')}:00:00`).toISOString()

/** Small deterministic PRNG so every fresh demo looks the same. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PIPELINE = ['shortlisted', 'aptitude_cleared', 'round1_completed', 'round2_completed', 'hr_round', 'offered']

// Sample faculty feedback per stage (two variants each).
const REMARKS: Record<string, [string, string]> = {
  shortlisted: ['Resume shortlisted — strong project section.', 'Shortlisted on academics and internship.'],
  aptitude_cleared: ['Cleared aptitude comfortably; quant was strong.', 'Aptitude cleared. Work on speed for verbal.'],
  round1_completed: ['Strong DSA round. Explained the approach clearly.', 'Good problem solving; revise graphs before round 2.'],
  round2_completed: ['Solid system design basics and clear communication.', 'Handled follow-ups well; be more concise.'],
  hr_round: ['Confident and well prepared for HR.', 'Good HR conversation; clarify relocation preferences.'],
  offered: ['Offer letter shared by email. Congratulations!', 'Offer confirmed — great effort through every round.'],
  rejected: ['Not selected this time. Practise timed coding and reapply.', 'Close call — focus on edge cases in coding rounds.'],
  withdrawn: ['Withdrew from the process.', 'Withdrew after accepting another offer.'],
}

function seed(): DemoDB {
  const rnd = mulberry32(2026)
  const today = todayISO()
  const created = stamp(addDays(today, -60))
  const db: DemoDB = {
    version: VERSION, profiles: [], accounts: [], student_profiles: [], batches: [], assignments: [],
    attendance: [], drives: [], applications: [], logs: [],
  }

  const person = (id: string, full_name: string, role: Role, email: string) => {
    db.profiles.push({ id, full_name, role, created_at: created })
    db.accounts.push({ user_id: id, email, password: DEMO_PASSWORD })
  }
  person('u-admin', 'Placement Admin', 'admin', 'admin@demo.edu')
  person('u-dean', 'Prof. S. Raman', 'dean', 'dean@demo.edu')
  person('u-fac1', 'Dr. Meera Krishnan', 'faculty', 'meera@demo.edu')
  person('u-fac2', 'Dr. Arvind Kumar', 'faculty', 'arvind@demo.edu')

  db.batches = [
    { id: 'b-cse-a', name: '2026 CSE-A', department: 'CSE', year: 2026, created_at: created },
    { id: 'b-cse-b', name: '2026 CSE-B', department: 'CSE', year: 2026, created_at: created },
    { id: 'b-ece-a', name: '2026 ECE-A', department: 'ECE', year: 2026, created_at: created },
  ]
  const facultyOf: Record<string, string> = { 'b-cse-a': 'u-fac1', 'b-cse-b': 'u-fac1', 'b-ece-a': 'u-fac2' }
  for (const [batch_id, faculty_id] of Object.entries(facultyOf))
    db.assignments.push({ id: uid('fbm'), faculty_id, batch_id, assigned_at: created, active: true })

  const roster: Record<string, string[]> = {
    'b-cse-a': ['Ananya Iyer', 'Rahul Menon', 'Priya Sharma', 'Karthik Raja', 'Divya Nair', 'Arjun Reddy', 'Sneha Kulkarni'],
    'b-cse-b': ['Vikram Singh', 'Lakshmi Prasad', 'Rohan Das', 'Meghana Rao', 'Aditya Joshi', 'Fathima Begum'],
    'b-ece-a': ['Harish Babu', 'Nandini Pillai', 'Sanjay Verma', 'Keerthana S', 'Imran Khan', 'Pooja Hegde'],
  }
  const students: string[] = []
  for (const [batch_id, names] of Object.entries(roster)) {
    const b = db.batches.find((x) => x.id === batch_id)!
    names.forEach((name, i) => {
      const id = `u-stu-${batch_id.slice(2)}-${i + 1}`
      const first = name.split(' ')[0]!.toLowerCase()
      person(id, name, 'student', `${first}@demo.edu`)
      db.student_profiles.push({
        user_id: id, roll_no: `26${b.department}${b.name.slice(-1)}${String(i + 1).padStart(2, '0')}`,
        department: b.department, batch_id, is_fastrack: true,
      })
      students.push(id)
    })
  }

  // ~5 weeks of weekday attendance (up to yesterday); each student has their own reliability.
  const days: string[] = []
  for (let i = 1; days.length < 25; i++) {
    const d = addDays(today, -i)
    const dow = new Date(`${d}T00:00:00`).getDay()
    if (dow !== 0 && dow !== 6) days.push(d)
  }
  for (const sp of db.student_profiles) {
    const reliability = 0.68 + rnd() * 0.3
    for (const date of days) {
      const r = rnd()
      const status: AttendanceStatus = r < reliability ? 'present' : r < reliability + (1 - reliability) * 0.7 ? 'absent' : 'leave'
      db.attendance.push({ id: uid('att'), student_id: sp.user_id, faculty_id: facultyOf[sp.batch_id!]!, date, status, remarks: null })
    }
  }

  const drive = (id: string, company_name: string, role_offered: string, ctc: string, offset: number, eligible_departments: string[], eligibility_criteria: string) =>
    db.drives.push({ id, company_name, role_offered, ctc, eligible_departments, eligibility_criteria, drive_date: addDays(today, offset), created_at: stamp(addDays(today, Math.min(offset, 0) - 14)) })
  drive('d-zoho', 'Zoho', 'Member Technical Staff', '8.4 LPA', 3, ['CSE', 'IT'], 'CGPA ≥ 7.0, no standing arrears. Online coding test followed by two technical rounds.')
  drive('d-fresh', 'Freshworks', 'Software Engineer I', '12 LPA', 10, [], 'CGPA ≥ 7.5. Strong DSA fundamentals; system design basics a plus.')
  drive('d-bosch', 'Bosch', 'Embedded Software Engineer', '6.5 LPA', 18, ['ECE', 'EEE', 'CSE'], '60% throughout. C/C++ and microcontroller basics.')
  drive('d-ti', 'Texas Instruments', 'Analog Design Intern', '1 L / month', 6, ['ECE'], 'ECE only. CGPA ≥ 8.0. Analog circuits interview.')
  drive('d-tcs', 'TCS Digital', 'Digital Engineer', '7 LPA', -12, [], '60% in 10th, 12th and UG. No active backlogs.')
  drive('d-infy', 'Infosys', 'Specialist Programmer', '9.5 LPA', -25, [], 'CGPA ≥ 6.5. HackWithInfy style coding assessment.')

  const apply = (drive_id: string, student_id: string, target: string, appliedOffset: number) => {
    const app: DApplication = { id: uid('app'), drive_id, student_id, applied_at: stamp(addDays(today, appliedOffset), 9), current_stage: 'applied' }
    db.applications.push(app)
    let path: string[] = []
    if (target === 'rejected' || target === 'withdrawn') {
      path = [...PIPELINE.slice(0, Math.floor(rnd() * 3)), target]
    } else if (target !== 'applied') {
      path = PIPELINE.slice(0, PIPELINE.indexOf(target) + 1)
    }
    const step = Math.max(1, Math.floor(-appliedOffset / (path.length + 1)))
    path.forEach((stage, i) => {
      db.logs.push({
        id: uid('log'), application_id: app.id, updated_by: 'u-fac1', stage,
        remarks: REMARKS[stage]?.[Math.floor(rnd() * 2)] ?? null,
        rating: stage === 'rejected' || stage === 'withdrawn' ? 2 + Math.floor(rnd() * 2) : 3 + Math.floor(rnd() * 3),
        updated_at: stamp(addDays(today, Math.min(-1, appliedOffset + step * (i + 1))), 11 + i),
      })
      app.current_stage = stage
    })
  }

  // The showcase student gets a varied history.
  const ananya = 'u-stu-cse-a-1'
  apply('d-infy', ananya, 'rejected', -30)
  apply('d-tcs', ananya, 'offered', -20)
  apply('d-fresh', ananya, 'round1_completed', -8)

  // Everyone else: completed drives have outcomes, upcoming ones are early-stage.
  const outcomes = ['offered', 'rejected', 'rejected', 'hr_round', 'round2_completed', 'rejected']
  for (const s of students) {
    if (s === ananya) continue
    const dept = db.student_profiles.find((p) => p.user_id === s)!.department
    for (const d of db.drives) {
      if (d.eligible_departments.length && !d.eligible_departments.includes(dept)) continue
      const past = d.drive_date! < today
      if (rnd() > (past ? 0.6 : 0.35)) continue
      const target = past ? outcomes[Math.floor(rnd() * outcomes.length)]! : rnd() > 0.5 ? 'shortlisted' : 'applied'
      apply(d.id, s, target, past ? -30 : -5)
    }
  }
  return db
}

function read(): DemoDB {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDB
      if (parsed.version === VERSION) return (memory = parsed)
    }
  } catch { /* storage blocked or corrupt — fall back to a fresh seed */ }
  memory = seed()
  persist()
  return memory
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory))
  } catch { /* private mode / quota: keep working in memory only */ }
}

/** Read-only access to the current demo data. */
export const db = () => read()

/** Apply a change and save it. */
export function mutate<T>(fn: (d: DemoDB) => T): T {
  const result = fn(read())
  persist()
  return result
}

export function resetDemoData() {
  memory = seed()
  persist()
}
