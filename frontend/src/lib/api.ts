import { supabase } from './supabaseClient'
import { ApiError } from './errors'
import { DEMO_MODE } from './config'
import { demoApi } from './demo/demoApi'
import type {
  Analytics, Application, AttendanceStatus, Batch, BatchRoster, BatchStudent, Drive, DriveInput,
  FacultyAssignment, Me, MyAttendance, Role, StudentDetails, UserRow,
} from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export { ApiError }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  if (res.status === 401) {
    await supabase.auth.signOut()
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }
  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.json()
      msg = typeof body.detail === 'string' ? body.detail : Array.isArray(body.detail)
        ? body.detail.map((d: { msg: string }) => d.msg).join(', ')
        : msg
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, msg || `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && p.set(k, String(v)))
  const s = p.toString()
  return s ? `?${s}` : ''
}

const json = (body: unknown) => JSON.stringify(body)

const realApi = {
  me: () => request<Me>('/auth/me'),

  // batches & assignments
  batches: () => request<Batch[]>('/batches'),
  createBatch: (b: Omit<Batch, 'id'>) => request<Batch>('/batches', { method: 'POST', body: json(b) }),
  updateBatch: (id: string, b: Partial<Batch>) =>
    request<Batch>(`/batches/${id}`, { method: 'PATCH', body: json(b) }),
  deleteBatch: (id: string) => request<void>(`/batches/${id}`, { method: 'DELETE' }),
  batchStudents: (id: string) => request<BatchStudent[]>(`/batches/${id}/students`),
  assignments: () => request<FacultyAssignment[]>('/batches/assignments/all'),
  assign: (faculty_id: string, batch_id: string) =>
    request<FacultyAssignment>('/batches/assignments', { method: 'POST', body: json({ faculty_id, batch_id }) }),
  unassign: (id: string) => request<void>(`/batches/assignments/${id}`, { method: 'DELETE' }),

  // attendance
  myAttendance: () => request<MyAttendance>('/attendance/me'),
  roster: (batchId: string, date: string) => request<BatchRoster>(`/attendance/batch/${batchId}${qs({ date })}`),
  saveAttendance: (batch_id: string, date: string, records: { student_id: string; status: AttendanceStatus }[]) =>
    request<{ saved: number }>('/attendance/bulk', { method: 'POST', body: json({ batch_id, date, records }) }),

  // drives
  drives: (opts: { upcoming?: boolean; eligible_only?: boolean } = {}) => request<Drive[]>(`/drives${qs(opts)}`),
  createDrive: (d: DriveInput) => request<Drive>('/drives', { method: 'POST', body: json(d) }),
  updateDrive: (id: string, d: Partial<DriveInput>) =>
    request<Drive>(`/drives/${id}`, { method: 'PATCH', body: json(d) }),
  deleteDrive: (id: string) => request<void>(`/drives/${id}`, { method: 'DELETE' }),
  apply: (driveId: string) => request<Application>(`/drives/${driveId}/apply`, { method: 'POST' }),

  // applications
  stages: () => request<string[]>('/applications/stages'),
  myApplications: () => request<Application[]>('/applications/me'),
  applications: (opts: { batch_id?: string; drive_id?: string; stage?: string } = {}) =>
    request<Application[]>(`/applications${qs(opts)}`),
  logStage: (id: string, stage: string, remarks?: string, rating?: number | null) =>
    request<Application>(`/applications/${id}/stages`, { method: 'POST', body: json({ stage, remarks, rating: rating ?? null }) }),

  // users
  users: (role?: Role) => request<UserRow[]>(`/users${qs({ role })}`),
  createUser: (u: { email: string; password: string; full_name: string; role: Role; student?: StudentDetails }) =>
    request<UserRow>('/users', { method: 'POST', body: json(u) }),
  updateUser: (id: string, u: { full_name?: string; role?: Role; student?: StudentDetails }) =>
    request<UserRow>(`/users/${id}`, { method: 'PATCH', body: json(u) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  analytics: () => request<Analytics>('/analytics'),
}

export type Api = typeof realApi

/** In demo mode every call is served from sample data in this browser. */
export const api: Api = DEMO_MODE ? demoApi : realApi
