import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { cn } from './cn'
import type { NavItem } from './nav'

interface Props {
  items: NavItem[]
  name: string
  roleLabel: string
  onSignOut: () => void
  onNavigate?: () => void
}

export function Sidebar({ items, name, roleLabel, onSignOut, onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Logo />
      <nav className="flex-1" aria-label="Primary">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive ? 'bg-brand-gradient text-white shadow-glow' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-700',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas p-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs capitalize text-ink-mute">{roleLabel}</p>
        </div>
        <button onClick={onSignOut} className="rounded-full p-2 text-ink-mute hover:bg-white hover:text-rose-600" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
