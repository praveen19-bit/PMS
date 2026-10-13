import { Star } from 'lucide-react'

/** Read-only 5-star rating in brand violet. */
export function Stars({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(5, value))
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: ${v.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < Math.round(v) ? '#7F56F5' : '#DACEFF'} stroke="none" />
      ))}
    </span>
  )
}
