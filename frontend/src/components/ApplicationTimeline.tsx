import { Check, X } from 'lucide-react'
import type { Application } from '@/lib/types'
import { fmtDate, isClosedStage, stageLabel } from '@/lib/format'
import { cn } from '@/components/ui/cn'
import { Stars } from '@/components/ui/Stars'

interface Step {
  key: string
  label: string
  at: string | null
  remarks?: string | null
  rating?: number | null
  state: 'done' | 'current' | 'failed' | 'offer' | 'upcoming'
}

/** applied → logged stages → (pending | offer | rejection), oldest first. */
export function buildSteps(app: Application): Step[] {
  const steps: Step[] = [{ key: 'applied', label: 'Applied', at: app.applied_at, state: 'done' }]
  for (const h of app.history) {
    if (h.stage === 'applied') continue
    steps.push({ key: h.id, label: stageLabel(h.stage), at: h.updated_at, remarks: h.remarks, rating: h.rating, state: 'done' })
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

/** `showRemarks` = false when the remarks are shown separately as review cards. */
export function ApplicationTimeline({ app, showRemarks = true }: { app: Application; showRemarks?: boolean }) {
  const steps = buildSteps(app)
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={s.key} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <span className={cn('absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 rounded-full', s.state === 'upcoming' ? 'bg-line' : 'bg-brand-200')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                s.state === 'done' && 'bg-grad text-white',
                s.state === 'offer' && 'bg-success text-white',
                s.state === 'failed' && 'bg-danger text-white',
                s.state === 'current' && 'bg-surface ring-2 ring-brand-500',
                s.state === 'upcoming' && 'border-2 border-dashed border-line bg-surface',
              )}
            >
              {s.state === 'failed' ? <X className="h-3 w-3" strokeWidth={3} />
                : s.state === 'current' ? <span className="bg-grad h-2.5 w-2.5 rounded-full" />
                : s.state !== 'upcoming' ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('flex flex-wrap items-center gap-x-2 text-sm font-medium', s.state === 'upcoming' && 'font-normal text-ink-mute', s.state === 'failed' && 'text-danger', s.state === 'offer' && 'text-success')}>
                {s.label}
                {s.rating ? <Stars value={s.rating} label={`${s.label} rating`} /> : null}
              </p>
              {s.at && <p className="text-[11px] text-ink-mute">{fmtDate(s.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
              {/* Remarks styled as a chat bubble, like the kit's message card. */}
              {showRemarks && s.remarks && <p className="mt-1.5 inline-block rounded-2xl rounded-tl-md bg-subtle px-3 py-2 text-xs text-ink-soft">{s.remarks}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export const applicationIsActive = (a: Application) => !isClosedStage(a.current_stage)
