import type { ReactNode } from 'react'
import { cn } from './cn'
import type { Tone } from '@/lib/format'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-grad text-white',
  danger: 'bg-coral-soft text-coral',
  warning: 'bg-amber-soft text-[#B9770A]',
  neutral: 'bg-[#F1F0F8] text-ink-soft',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-none', tones[tone], className)}>
      {children}
    </span>
  )
}
