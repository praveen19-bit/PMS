import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** Small label above the title. */
  eyebrow?: ReactNode
  /** Kept for API compatibility; this design has no back button. */
  back?: boolean
}

export function PageHeader({ title, subtitle, action, eyebrow }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium text-brand-500">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
