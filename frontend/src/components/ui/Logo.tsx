import { cn } from './cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-9 w-9', className)} aria-hidden>
      <rect width="32" height="32" rx="11" fill="#111214" />
      <g fill="#D4F25C">
        <rect x="11" y="6.5" width="3.2" height="19" rx="1.6" />
        <rect x="17.8" y="6.5" width="3.2" height="19" rx="1.6" />
        <rect x="6.5" y="11" width="19" height="3.2" rx="1.6" />
        <rect x="6.5" y="17.8" width="19" height="3.2" rx="1.6" />
      </g>
    </svg>
  )
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && <span className="font-display text-[17px] font-medium tracking-tight">Fastrack</span>}
    </span>
  )
}
