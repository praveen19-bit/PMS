import { cn } from './cn'

/** Segmented pill control; the active segment uses the violet gradient. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 py-1 scrollbar-none sm:mx-0 sm:px-0" role="tablist">
      <div className="glass inline-flex gap-1 rounded-xl p-1">
        {items.map((it) => (
          <button
            key={it.value}
            role="tab"
            aria-selected={value === it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
              value === it.value ? 'bg-grad text-white shadow-glow' : 'text-ink-soft hover:text-brand-600',
            )}
          >
            {it.label}
            {it.count !== undefined && <span className={cn('ml-1.5 tabular-nums', value === it.value ? 'text-white/80' : 'text-ink-mute')}>{it.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
