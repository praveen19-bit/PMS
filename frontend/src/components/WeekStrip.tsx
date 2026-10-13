import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays } from '@/lib/demo/store'
import { cn } from '@/components/ui/cn'

const weekday = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
const dayNum = (iso: string) => new Date(`${iso}T00:00:00`).getDate()

/** Monday of the week containing `iso`. */
export function weekStart(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return addDays(iso, -((d.getDay() + 6) % 7))
}

interface Props {
  /** Any date inside the week to show. */
  value: string
  onChange: (iso: string) => void
  /** Dates that get a dot marker (e.g. days with drives). */
  marked?: Set<string>
  /** Latest selectable date (inclusive). */
  max?: string
}

/** The kit's "schedule" calendar: one week, selected day as a tall violet pill. */
export function WeekStrip({ value, onChange, marked, max }: Props) {
  const start = weekStart(value)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const month = new Date(`${addDays(start, 3)}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const nextWeek = addDays(value, 7)

  return (
    <div>
      <p className="mb-3 text-center text-sm font-medium">{month}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(addDays(value, -7))} aria-label="Previous week" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-600 hover:bg-brand-50">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <ol className="grid flex-1 grid-cols-7 gap-1">
          {days.map((d) => {
            const selected = d === value
            const disabled = Boolean(max && d > max)
            return (
              <li key={d}>
                <button
                  onClick={() => onChange(d)}
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={new Date(`${d}T00:00:00`).toDateString()}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-2xl py-2.5 text-ink transition disabled:opacity-30',
                    selected ? 'bg-grad text-white shadow-glow' : 'hover:bg-brand-50',
                  )}
                >
                  <span className={cn('text-[10px]', selected ? 'text-white/80' : 'text-ink-mute')}>{weekday(d)}</span>
                  <span className="text-base font-medium tabular-nums">{dayNum(d)}</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', marked?.has(d) ? (selected ? 'bg-white' : 'bg-brand-500') : 'bg-transparent')} />
                </button>
              </li>
            )
          })}
        </ol>
        <button onClick={() => onChange(max && nextWeek > max ? max : nextWeek)} aria-label="Next week" disabled={Boolean(max && weekStart(nextWeek) > max)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-600 hover:bg-brand-50 disabled:opacity-30">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
