import { NavLink } from 'react-router-dom'
import { cn } from './cn'
import type { NavItem } from './nav'

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 backdrop-blur-lg pb-safe md:hidden" aria-label="Primary">
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-semibold transition', isActive ? 'text-brand-600' : 'text-ink-mute')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('grid h-8 w-12 place-items-center rounded-full transition', isActive && 'bg-brand-50')}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
