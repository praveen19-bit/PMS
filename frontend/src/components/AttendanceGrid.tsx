import { Check, Minus, X } from 'lucide-react'
import type { AttendanceStatus, RosterEntry } from '@/lib/types'
import { cn } from '@/components/ui/cn'
import { Avatar } from '@/components/ui/Avatar'

const OPTIONS: { value: AttendanceStatus; label: string; icon: typeof Check; on: string }[] = [
  { value: 'present', label: 'Present', icon: Check, on: 'bg-lime text-lime-ink shadow-[0_6px_16px_-8px_rgba(150,190,20,0.9)]' },
  { value: 'absent', label: 'Absent', icon: X, on: 'bg-ink text-white shadow-glow' },
  { value: 'leave', label: 'Leave', icon: Minus, on: 'bg-white text-ink ring-1 ring-ink/20 bg-hatch' },
]

interface Props {
  entries: RosterEntry[]
  value: Record<string, AttendanceStatus | undefined>
  onChange: (studentId: string, status: AttendanceStatus) => void
  dirty: Set<string>
}

/** Faculty roster: one row per student with a present / absent / leave segmented toggle. */
export function AttendanceGrid({ entries, value, onChange, dirty }: Props) {
  return (
    <ul className="divide-y divide-line">
      {entries.map((e) => {
        const current = value[e.student_id]
        return (
          <li key={e.student_id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Avatar name={e.full_name} className="hidden sm:grid" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {e.full_name}
                {dirty.has(e.student_id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" title="Unsaved" />}
              </p>
              <p className="text-xs text-ink-mute">{e.roll_no}</p>
            </div>
            <div className="glass flex shrink-0 gap-1 rounded-full p-1" role="radiogroup" aria-label={`Attendance for ${e.full_name}`}>
              {OPTIONS.map(({ value: v, label, icon: Icon, on }) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={current === v}
                  aria-label={label}
                  title={label}
                  onClick={() => onChange(e.student_id, v)}
                  className={cn(
                    'flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition sm:px-3',
                    current === v ? on : 'text-ink-mute hover:bg-white/80 hover:text-ink',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const DOT: Record<AttendanceStatus, string> = { present: 'bg-lime', absent: 'bg-ink', leave: 'bg-white bg-hatch ring-1 ring-ink/15' }

/** Student-facing: recent days as small capsules, with a legend. */
export function AttendanceStrip({ records }: { records: { date: string; status: AttendanceStatus }[] }) {
  const recent = [...records].slice(0, 30).reverse()
  if (!recent.length) return null
  return (
    <div>
      <div className="flex flex-wrap gap-1" aria-label="Recent attendance, oldest first">
        {recent.map((r) => <span key={r.date} title={`${r.date}: ${r.status}`} className={cn('h-5 w-2.5 rounded-full', DOT[r.status])} />)}
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-ink-mute">
        {(['present', 'absent', 'leave'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1 capitalize"><span className={cn('h-2.5 w-2.5 rounded-full', DOT[s])} />{s}</span>
        ))}
      </div>
    </div>
  )
}
