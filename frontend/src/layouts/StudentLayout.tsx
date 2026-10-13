import { NavLink, Outlet } from 'react-router-dom'
import { Briefcase, Home, ListChecks, UserRound } from 'lucide-react'
import { BottomNav } from '@/components/ui/BottomNav'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/components/ui/cn'
import type { NavItem } from '@/components/ui/nav'
import { useAuth } from '@/hooks/useAuth'

const items: NavItem[] = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/drives', label: 'Drives', icon: Briefcase },
  { to: '/student/applications', label: 'Applications', icon: ListChecks },
  { to: '/student/profile', label: 'Profile', icon: UserRound },
]

export function StudentLayout() {
  const { me } = useAuth()
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="blob -left-24 -top-24 h-72 w-72 bg-brand-300/40" />
      <div className="blob -right-20 top-10 h-64 w-64 bg-teal-200/40" />

      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('rounded-full px-4 py-2 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:text-brand-700')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/student/profile" aria-label="Profile">
            <Avatar name={me?.profile.full_name ?? ''} />
          </NavLink>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12">
        <Outlet />
      </main>
      <BottomNav items={items} />
    </div>
  )
}
