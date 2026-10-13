import { Check, X } from 'lucide-react'
import type { Application } from '@/lib/types'
import { fmtDate, isClosedStage, stageLabel } from '@/lib/format'
import { cn } from '@/components/ui/cn'

interface Step {
  key: string
  label: string
  at: string | null
  remarks?: string | null
  state: 'done' | 'current' | 'failed' | 'offer' | 'upcoming'
}

/** applied → logged stages → (pending | offer | rejection), oldest first. */
export function buildSteps(app: Application): Step[] {
  const steps: Step[] = [{ key: 'applied', label: 'Applied', at: app.applied_at, state: 'done' }]
  for (const h of app.history) {
    if (h.stage === 'applied') continue
    steps.push({ key: h.id, label: stageLabel(h.stage), at: h.updated_at, remarks: h.remarks, state: 'done' })
  }
  const last = steps[steps.length - 1]!
  const stage = app.current_stage
  if (stage === 'offered') last.state = 'offer'
  else if (stage === 'rejected' || stage === 'withdrawn') last.state = 'failed'
  else {
    last.state = 'current'
    steps.push({ key: 'next', label: 'Awaiting next update', at: null, state: 'upcoming' })
  }
  return steps
}

export function ApplicationTimeline({ app }: { app: Application }) {
  const steps = buildSteps(app)
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span className={cn('absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-px', s.state === 'upcoming' ? 'bg-line' : 'bg-ink/20')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                s.state === 'offer' && 'bg-lime text-lime-ink',
                s.state === 'failed' && 'bg-rose-500 text-white',
                s.state === 'current' && 'bg-ink text-lime ring-4 ring-lime/40',
                s.state === 'done' && 'bg-ink text-white',
                s.state === 'upcoming' && 'border border-dashed border-ink/25 bg-white/60',
              )}
            >
              {s.state === 'failed' ? <X className="h-3 w-3" strokeWidth={3} /> : s.state !== 'upcoming' && s.state !== 'current' ? <Check className="h-3 w-3" strokeWidth={3} /> : s.state === 'current' ? <span className="h-1.5 w-1.5 rounded-full bg-lime" /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-sm font-medium', s.state === 'upcoming' && 'font-normal text-ink-mute', s.state === 'failed' && 'text-rose-600')}>{s.label}</p>
              {s.at && <p className="text-[11px] text-ink-mute">{fmtDate(s.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
              {s.remarks && <p className="mt-1.5 rounded-2xl bg-white/70 px-3 py-2 text-xs text-ink-soft">{s.remarks}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export const applicationIsActive = (a: Application) => !isClosedStage(a.current_stage)
