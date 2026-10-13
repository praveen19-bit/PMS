import { initials } from '@/lib/format'
import { cn } from './cn'

// Soft tint per person (stable from their name) so lists are easy to scan.
const TINTS = ['bg-brand-500/15 text-brand-700', 'bg-accent/15 text-accent', 'bg-warning/15 text-warning', 'bg-success/15 text-success', 'bg-info/15 text-info']

export type AvatarStatus = 'online' | 'present' | 'away' | 'leave' | 'absent' | 'offline' | 'open' | 'closing' | 'closed' | 'placed'

const STATUS: Record<AvatarStatus, { cls: string; label: string }> = {
  online: { cls: 'bg-success', label: 'Online' },
  present: { cls: 'bg-success', label: 'Present' },
  away: { cls: 'bg-warning', label: 'Away' },
  leave: { cls: 'bg-warning', label: 'On leave' },
  absent: { cls: 'bg-danger', label: 'Absent' },
  offline: { cls: 'bg-ink-mute', label: 'Offline' },
  open: { cls: 'bg-success', label: 'Open for applications' },
  closing: { cls: 'bg-warning', label: 'Closing soon' },
  closed: { cls: 'bg-ink-mute', label: 'Closed' },
  placed: { cls: 'bg-success', label: 'Placed' },
}

interface Props {
  name: string
  className?: string
  /** Purple story-style ring from the kit. */
  ring?: boolean
  /** Status indicator dot (bottom-right). */
  status?: AvatarStatus
}

/** Initials avatar with optional ring and status indicator. */
export function Avatar({ name, className, ring, status }: Props) {
  const tint = TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]
  const text = initials(name) || '?'
  const dot = status && (
    <span
      className={cn('absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-surface', STATUS[status].cls)}
      role="img"
      aria-label={STATUS[status].label}
      title={STATUS[status].label}
    />
  )

  if (!ring) {
    return (
      <span className={cn('relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold', tint, className)}>
        {text}{dot}
      </span>
    )
  }
  return (
    <span className={cn('bg-grad relative grid shrink-0 place-items-center rounded-full p-[2px]', className)}>
      <span className="grid h-full w-full place-items-center rounded-full bg-surface p-[2px]">
        <span className={cn('grid h-full w-full place-items-center rounded-full text-sm font-semibold', tint)}>{text}</span>
      </span>
      {dot}
    </span>
  )
}
