import { initials } from '@/lib/format'
import { cn } from './cn'

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700', className)}>
      {initials(name) || '?'}
    </span>
  )
}
