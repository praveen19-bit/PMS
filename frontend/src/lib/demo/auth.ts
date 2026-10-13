/** Demo-mode sign-in: remembers which sample user is "logged in" in this browser. */
import { ApiError } from '@/lib/errors'
import { db } from './store'

const KEY = 'fastrack-demo-user'
const listeners = new Set<(userId: string | null) => void>()
let current: string | null = null

try {
  current = localStorage.getItem(KEY)
} catch { /* storage unavailable */ }

function set(userId: string | null) {
  current = userId
  try {
    if (userId) localStorage.setItem(KEY, userId)
    else localStorage.removeItem(KEY)
  } catch { /* storage unavailable */ }
  listeners.forEach((l) => l(userId))
}

export function getDemoUserId(): string | null {
  // A deleted or reset user is treated as signed out.
  return current && db().profiles.some((p) => p.id === current) ? current : null
}

export function onDemoAuthChange(fn: (userId: string | null) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function demoSignInAs(userId: string) {
  set(userId)
}

export function demoSignIn(email: string, password: string) {
  const acct = db().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!acct || acct.password !== password) throw new ApiError(400, 'Invalid login credentials')
  set(acct.user_id)
}

export function demoSignOut() {
  set(null)
}
