import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-ink', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <span className="glass grid h-14 w-14 place-items-center rounded-full"><Spinner /></span>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-3xl bg-white/50', className)} />
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-4xl" />
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-4xl px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-lime text-lime-ink">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <h3 className="mt-4 text-lg font-normal tracking-tight">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-mute">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, action }: { title?: string; message?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="glass flex flex-col items-center rounded-4xl px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600"><AlertTriangle className="h-5 w-5" /></span>
      <h3 className="mt-3 text-lg font-normal tracking-tight">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>}
      {action && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
