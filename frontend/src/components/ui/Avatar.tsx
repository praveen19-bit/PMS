import { initials } from '@/lib/format'
import { cn } from './cn'

// Soft tint per person (stable from their name) so lists are easy to scan.
const TINTS = ['bg-[#ECE6FF] text-brand-700', 'bg-[#FDE7F2] text-[#C23F80]', 'bg-[#FFF1D6] text-[#A86A00]', 'bg-[#E3F1FF] text-[#2F6FB5]', 'bg-[#E5F6EF] text-[#21835D]']

/** Initials avatar; `ring` adds the violet story-style ring from the kit. */
export function Avatar({ name, className, ring }: { name: string; className?: string; ring?: boolean }) {
  const tint = TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]
  const face = (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold', tint, !ring && className)}>
      {initials(name) || '?'}
    </span>
  )
  if (!ring) return face
  return (
    <span className={cn('bg-grad grid shrink-0 place-items-center rounded-full p-[2px]', className)}>
      <span className="grid h-full w-full place-items-center rounded-full bg-white p-[2px]">
        <span className={cn('grid h-full w-full place-items-center rounded-full text-sm font-semibold', tint)}>{initials(name) || '?'}</span>
      </span>
    </span>
  )
}
