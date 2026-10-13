import { Check, Minus, X } from 'lucide-react'
import type { AttendanceStatus, RosterEntry } from '@/lib/types'
import { cn } from '@/components/ui/cn'

const OPTIONS: { value: AttendanceStatus; label: string; short: string; icon: typeof Check; on: string }[] = [
  { value: 'present', label: 'Present', short: 'P', icon: Check, on: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'absent', label: 'Absent', short: 'A', icon: X, on: 'bg-rose-500 text-white border-rose-500' },
  { value: 'leave', label: 'Leave', short: 'L', icon: Minus, on: 'bg-amber-400 text-white border-amber-400' },
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
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-semibold">
                {e.full_name}
                {dirty.has(e.student_id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" title="Unsaved" />}
              </p>
              <p className="text-xs text-ink-mute">{e.roll_no}</p>
            </div>
            <div className="flex shrink-0 gap-1.5" role="radiogroup" aria-label={`Attendance for ${e.full_name}`}>
              {OPTIONS.map(({ value: v, label, short, icon: Icon, on }) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={current === v}
                  aria-label={label}
                  title={label}
                  onClick={() => onChange(e.student_id, v)}
                  className={cn(
                    'flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-bold transition',
                    current === v ? on : 'border-line bg-white text-ink-mute hover:border-brand-200 hover:text-ink',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={3} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sr-only sm:hidden">{short}</span>
                </button>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Student-facing: recent days as coloured dots. */
export function AttendanceStrip({ records }: { records: { date: string; status: AttendanceStatus }[] }) {
  const color: Record<AttendanceStatus, string> = { present: 'bg-emerald-400', absent: 'bg-rose-400', leave: 'bg-amber-300' }
  const recent = [...records].slice(0, 28).reverse()
  if (!recent.length) return null
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Recent attendance">
      {recent.map((r) => (
        <span key={r.date} title={`${r.date}: ${r.status}`} className={cn('h-3.5 w-3.5 rounded-[5px]', color[r.status])} />
      ))}
    </div>
  )
}
