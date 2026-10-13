import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from './cn'

/** Read-only 5-star rating (filled + outlined). */
export function Stars({ value, label, size = 'sm' }: { value: number; label: string; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(5, value))
  const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: ${v.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        i < Math.round(v)
          ? <Star key={i} className={cn(cls, 'text-warning')} fill="currentColor" stroke="none" />
          : <Star key={i} className={cn(cls, 'text-ink-mute/60')} fill="none" strokeWidth={1.8} />
      ))}
    </span>
  )
}

/** Interactive star picker; click the current value again to clear it. */
export function StarInput({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(value === n ? null : n)}
          className="rounded-md p-0.5 transition hover:scale-110"
        >
          <Star className={cn('h-6 w-6', n <= shown ? 'text-warning' : 'text-ink-mute/60')} fill={n <= shown ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      ))}
      {value != null && <span className="ml-1 text-xs text-ink-mute">{value}/5</span>}
    </div>
  )
}
