import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

/** Liquid-glass surface used for every panel. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass sheen rounded-4xl', className)} {...rest} />
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h3 className="text-[15px] font-medium tracking-tight text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint, icon, highlight }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; highlight?: boolean }) {
  return (
    <Card className={cn('p-4 sm:p-5', highlight && '!bg-lime/90 !border-lime')}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-medium', highlight ? 'text-lime-ink/70' : 'text-ink-mute')}>{label}</p>
        {icon && <span className={cn('grid h-8 w-8 place-items-center rounded-full', highlight ? 'bg-ink text-lime' : 'bg-white/80 text-ink')}>{icon}</span>}
      </div>
      <p className="num mt-3 text-3xl sm:text-4xl">{value}</p>
      {hint && <p className={cn('mt-1 text-xs', highlight ? 'text-lime-ink/70' : 'text-ink-mute')}>{hint}</p>}
    </Card>
  )
}

/** Small highlighted value chip, as on the reference charts. */
export function ValueChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md bg-lime px-1.5 py-0.5 text-[10px] font-semibold text-lime-ink shadow-sm', className)}>{children}</span>
}
