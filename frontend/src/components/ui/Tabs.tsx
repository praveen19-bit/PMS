import { cn } from './cn'

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      <div className="inline-flex gap-1 rounded-full border border-line bg-white p-1 shadow-card">
        {items.map((it) => (
          <button
            key={it.value}
            role="tab"
            aria-selected={value === it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition',
              value === it.value ? 'bg-brand-gradient text-white shadow-glow' : 'text-ink-soft hover:text-brand-700',
            )}
          >
            {it.label}
            {it.count !== undefined && <span className="ml-1.5 opacity-70">{it.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
