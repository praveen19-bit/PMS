import { Zap } from 'lucide-react'
import { cn } from './cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('bg-grad grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-glow', className)}>
      <Zap className="h-5 w-5" fill="currentColor" />
    </span>
  )
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && <span className="text-lg font-semibold tracking-tight">Fastrack<span className="text-brand-500">.</span></span>}
    </span>
  )
}
