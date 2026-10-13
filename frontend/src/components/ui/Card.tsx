import type { HTMLAttributes, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from './cn'
import type { Tone } from '@/lib/format'

/** Glass card (16px radius, kit shadow) used for every panel. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass sheen rounded-2xl', className)} {...rest} />
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export interface TrendValue {
  /** Change vs the comparison period, e.g. +12 (percent or points). */
  delta: number
  /** What it's compared with, e.g. "vs last week". */
  label: string
  /** Unit appended to the delta. Default "%". */
  unit?: string
  /** When true, a fall is good (e.g. absences). */
  invert?: boolean
}

/** "▲ +12% vs last week" — green when the change is good, red when bad. */
export function Trend({ delta, label, unit = '%', invert }: TrendValue) {
  const flat = Math.abs(delta) < 0.5
  const good = flat ? null : (delta > 0) !== Boolean(invert)
  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={cn(
        'inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 font-semibold tabular-nums',
        good === null ? 'bg-subtle text-ink-soft' : good ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
      )}>
        <Icon className="h-3 w-3" strokeWidth={2.6} aria-hidden />
        {flat ? '0' : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}`}{unit}
      </span>
      <span className="text-ink-mute">{label}</span>
    </span>
  )
}

const statColor: Record<Tone, string> = {
  brand: 'text-brand-600', success: 'text-success', danger: 'text-danger', warning: 'text-warning', neutral: 'text-ink',
}
const statIcon: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-600', success: 'bg-success/15 text-success', danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning', neutral: 'bg-subtle text-ink-soft',
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: Tone
  /** Use the kit's pink accent. */
  pink?: boolean
  trend?: TrendValue
}

/** Metric display: label, big number, optional trend vs a previous period. */
export function StatCard({ label, value, hint, icon, tone = 'brand', pink, trend }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-mute">{label}</p>
        {icon && <span className={cn('grid h-9 w-9 place-items-center rounded-xl', pink ? 'bg-accent/15 text-accent' : statIcon[tone])}>{icon}</span>}
      </div>
      <p className={cn('num mt-2 text-2xl sm:text-3xl', pink ? 'text-accent' : statColor[tone])}>{value}</p>
      {trend ? <div className="mt-2"><Trend {...trend} /></div> : hint && <p className="mt-2 text-xs text-ink-mute">{hint}</p>}
    </Card>
  )
}

/** Small purple value chip. */
export function ValueChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('bg-grad inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white shadow-glow', className)}>{children}</span>
}

/** Progress indicator: gradient bar with a percentage on the right. */
export function Progress({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && <p className="mb-2 text-xs text-ink-mute">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className="bg-grad h-full rounded-full transition-[width] duration-700" style={{ width: `${v}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-medium tabular-nums text-ink-soft">{Math.round(v)}%</span>
      </div>
    </div>
  )
}
