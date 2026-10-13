import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'
import type { Tone } from '@/lib/format'

/** Liquid-glass white card used for every panel. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass sheen rounded-3xl', className)} {...rest} />
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  )
}

const statColor: Record<Tone, string> = {
  brand: 'text-brand-600', success: 'text-brand-600', danger: 'text-coral', warning: 'text-amber', neutral: 'text-ink',
}
const statIcon: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-600', success: 'bg-brand-100 text-brand-600', danger: 'bg-coral-soft text-coral',
  warning: 'bg-amber-soft text-amber', neutral: 'bg-[#F1F0F8] text-ink-soft',
}

export function StatCard({ label, value, hint, icon, tone = 'brand', pink }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; pink?: boolean }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-mute">{label}</p>
        {icon && <span className={cn('grid h-9 w-9 place-items-center rounded-2xl', pink ? 'bg-pink-soft text-pink' : statIcon[tone])}>{icon}</span>}
      </div>
      <p className={cn('num mt-2 text-2xl sm:text-3xl', pink ? 'text-pink' : statColor[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </Card>
  )
}

/** Violet value bubble, as on the kit's chart tooltip. */
export function ValueChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('bg-grad inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white shadow-glow', className)}>{children}</span>
}

/** Thin gradient progress bar with a percentage on the right. */
export function Progress({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] text-ink-mute">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEEDF7]" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
          <div className="bg-grad h-full rounded-full transition-[width] duration-700" style={{ width: `${v}%` }} />
        </div>
        <span className="w-9 text-right text-xs font-medium tabular-nums text-ink-soft">{Math.round(v)}%</span>
      </div>
    </div>
  )
}
