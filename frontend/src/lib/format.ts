export const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  aptitude_cleared: 'Aptitude cleared',
  round1_completed: 'Round 1 completed',
  round2_completed: 'Round 2 completed',
  hr_round: 'HR round',
  offered: 'Offer received',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
}

export const stageLabel = (s: string) =>
  STAGE_LABELS[s] ?? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'neutral'

export const stageTone = (s: string): Tone =>
  s === 'offered' ? 'success' : s === 'rejected' ? 'danger' : s === 'withdrawn' ? 'neutral' : s === 'applied' ? 'neutral' : 'brand'

export const isClosedStage = (s: string) => ['offered', 'rejected', 'withdrawn'].includes(s)

export const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export const fmtDate = (iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '—'
  // Date-only strings are parsed as local dates to avoid off-by-one in negative TZ offsets.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return d.toLocaleDateString(undefined, opts)
}

export const daysUntil = (iso?: string | null) => {
  if (!iso) return null
  const ms = new Date(`${iso}T00:00:00`).getTime() - new Date(`${todayISO()}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
