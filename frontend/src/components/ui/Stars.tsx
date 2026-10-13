import { Star } from 'lucide-react'

/** Read-only 5-star rating. */
export function Stars({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(5, value))
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: ${v.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < Math.round(v) ? 'h-3.5 w-3.5 text-warning' : 'h-3.5 w-3.5 text-line'} fill="currentColor" stroke="none" />
      ))}
    </span>
  )
}
