import { initials } from '@/lib/format'
import { cn } from './cn'

// Deterministic soft tint per person so lists are easy to scan.
const TINTS = ['bg-[#E6E8EC]', 'bg-[#EAF9B4]', 'bg-[#E3E6F2]', 'bg-[#F1E8DF]', 'bg-[#DFEFEA]']

export function Avatar({ name, className }: { name: string; className?: string }) {
  const tint = TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-ink ring-2 ring-white', tint, className)}>
      {initials(name) || '?'}
    </span>
  )
}
