import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CircleHelp, FlaskConical, LogOut, RefreshCw, Search } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'
import { useAuth } from '@/hooks/useAuth'
import { DEMO_MODE } from '@/lib/config'
import { CommandPalette } from './CommandPalette'
import { UserMenu } from './UserMenu'
import { HELP, NAV } from './nav'

/**
 * One shell for every role:
 *  - top glass bar with pill navigation (desktop) and the user menu
 *  - slim glass tool rail on the left (desktop)
 *  - floating liquid-glass dock with the navigation (phones & tablets)
 */
export function AppShell() {
  const { me, signOut } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const { pathname } = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const role = me?.profile.role ?? 'student'
  const nav = NAV[role]

  const refresh = useCallback(async () => {
    setSpinning(true)
    await qc.invalidateQueries()
    setSpinning(false)
    toast('Data refreshed')
  }, [qc, toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen">
      {/* ---------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 lg:px-6 lg:pt-5">
        <div className="glass-strong mx-auto flex h-16 max-w-[1480px] items-center gap-3 rounded-full pl-3 pr-2.5">
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition',
                    isActive ? 'bg-ink text-white shadow-glow' : 'text-ink-soft hover:bg-white/80 hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {DEMO_MODE && (
              <span className="hidden items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-xs font-medium text-lime-ink sm:inline-flex" title="Sample data, saved only in this browser">
                <FlaskConical className="h-3.5 w-3.5" /> Demo
              </span>
            )}
            <div className="hidden text-right leading-tight md:block">
              <p className="text-[13px] font-medium">{me?.profile.full_name}</p>
              <p className="text-[11px] capitalize text-ink-mute">{role}</p>
            </div>
            <IconButton label="Search (Ctrl+K)" className="lg:hidden" onClick={() => setPaletteOpen(true)}>
              <Search className="h-4 w-4" />
            </IconButton>
            <IconButton label="Refresh data" className="hidden sm:grid" onClick={refresh}>
              <RefreshCw className={cn('h-4 w-4', spinning && 'animate-spin')} />
            </IconButton>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 sm:px-5 lg:px-6">
        {/* ------------------------------------------------------ tool rail */}
        <aside className="sticky top-28 hidden h-fit flex-col items-center gap-2 lg:flex" aria-label="Tools">
          <div className="glass flex flex-col gap-2 rounded-full p-2">
            <IconButton label="Search (Ctrl+K)" active onClick={() => setPaletteOpen(true)}><Search className="h-4 w-4" /></IconButton>
            <IconButton label="Refresh data" onClick={refresh}><RefreshCw className={cn('h-4 w-4', spinning && 'animate-spin')} /></IconButton>
            <IconButton label="Help" onClick={() => setHelpOpen(true)}><CircleHelp className="h-4 w-4" /></IconButton>
          </div>
          <div className="glass rounded-full p-2">
            <IconButton label="Sign out" onClick={signOut}><LogOut className="h-4 w-4" /></IconButton>
          </div>
        </aside>

        <main key={pathname} className="min-w-0 flex-1 animate-fade-up pb-32 pt-6 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------- mobile glass dock */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-safe lg:hidden" aria-label="Primary">
        <ul
          className="glass-strong mx-auto mb-2 grid max-w-md gap-1 rounded-full p-1.5"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition',
                    isActive ? 'bg-ink text-white shadow-glow' : 'text-ink-soft active:bg-white/70',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-5 w-5', isActive && 'text-lime')} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="max-w-full truncate px-1">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} nav={nav} onRefresh={refresh} onSignOut={signOut} />
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="How this works" description={`Tips for the ${role} view`}>
        <ol className="space-y-3 pb-4">
          {HELP[role].map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-soft">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime text-[11px] font-semibold text-lime-ink">{i + 1}</span>
              {tip}
            </li>
          ))}
          <li className="flex gap-3 text-sm text-ink-soft">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white">⌘K</span>
            Press Ctrl+K (or ⌘K) anywhere to jump between pages.
          </li>
        </ol>
      </Modal>
    </div>
  )
}
