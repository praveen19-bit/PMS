import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { IconButton } from './Button'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** Rendered as a breadcrumb above the title. */
  eyebrow?: ReactNode
  /** Show a round back button (desktop). */
  back?: boolean
}

export function PageHeader({ title, subtitle, action, eyebrow, back = true }: Props) {
  const navigate = useNavigate()
  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-end gap-4">
        {back && (
          <IconButton label="Go back" className="mb-1 hidden lg:grid" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 flex items-center gap-1 text-xs text-ink-mute">
              <span>Fastrack</span><ChevronRight className="h-3 w-3" /><span className="text-ink-soft">{eyebrow}</span>
            </p>
          )}
          <h1 className="font-display text-[32px] font-light leading-[1.05] tracking-[-0.03em] sm:text-[40px] lg:text-[44px]">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
