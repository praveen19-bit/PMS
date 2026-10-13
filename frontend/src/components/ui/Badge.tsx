import type { ReactNode } from 'react'
import { cn } from './cn'
import type { Tone } from '@/lib/format'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-700',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  neutral: 'bg-subtle text-ink-soft',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-none', tones[tone], className)}>
      {children}
    </span>
  )
}
