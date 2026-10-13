import type { ReactNode } from 'react'
import { cn } from './cn'
import type { Tone } from '@/lib/format'

const tones: Record<Tone, string> = {
  brand: 'bg-ink text-white',
  success: 'bg-lime text-lime-ink',
  danger: 'bg-rose-100/90 text-rose-700',
  warning: 'bg-amber-100/90 text-amber-800',
  neutral: 'bg-white/80 text-ink-soft ring-1 ring-inset ring-line',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-none', tones[tone], className)}>
      {children}
    </span>
  )
}
