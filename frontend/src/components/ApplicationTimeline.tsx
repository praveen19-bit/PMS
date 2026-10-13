import { CheckCircle2, Circle, CircleDot, XCircle } from 'lucide-react'
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
        const Icon = s.state === 'offer' ? CheckCircle2 : s.state === 'failed' ? XCircle : s.state === 'current' ? CircleDot : s.state === 'done' ? CheckCircle2 : Circle
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span className={cn('absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5', s.state === 'upcoming' ? 'bg-line' : 'bg-brand-200')} aria-hidden />
            )}
            <Icon
              className={cn(
                'relative z-10 h-6 w-6 shrink-0 rounded-full bg-white',
                s.state === 'offer' && 'text-emerald-500',
                s.state === 'failed' && 'text-rose-500',
                s.state === 'current' && 'text-brand-500',
                s.state === 'done' && 'text-brand-400',
                s.state === 'upcoming' && 'text-slate-300',
              )}
            />
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-sm font-semibold', s.state === 'upcoming' && 'text-ink-mute', s.state === 'offer' && 'text-emerald-600', s.state === 'failed' && 'text-rose-600')}>
                {s.label}
              </p>
              {s.at && <p className="text-xs text-ink-mute">{fmtDate(s.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
              {s.remarks && <p className="mt-1 rounded-lg bg-canvas px-2.5 py-1.5 text-xs text-ink-soft">{s.remarks}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export const applicationIsActive = (a: Application) => !isClosedStage(a.current_stage)
