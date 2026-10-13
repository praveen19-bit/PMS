import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CircleHelp, FlaskConical, LogOut, Menu, RefreshCw, Search } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'
import { useAuth } from '@/hooks/useAuth'
import { DEMO_MODE } from '@/lib/config'
import { CommandPalette } from './CommandPalette'
import { UserMenu } from './UserMenu'
import { HELP, NAV } from './nav'

const COLLAPSE_KEY = 'fastrack-sidebar-collapsed'

/**
 * One shell for every role:
 *  - collapsible glass sidebar with the navigation (desktop)
 *  - top bar with a search pill and the user menu
 *  - white glass bottom tab bar (phones & tablets)
 */
export function AppShell() {
  const { me, signOut } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const { pathname } = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
  })
  const role = me?.profile.role ?? 'student'
  const nav = NAV[role]

  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1') } catch { /* storage unavailable */ }
    return !c
  })

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

  // "Friends" section from the kit: the people/batches relevant to this user.
  const people: { name: string; sub: string }[] =
    role === 'faculty' ? (me?.assigned_batches ?? []).map((b) => ({ name: b.name, sub: `${b.department} batch` }))
    : role === 'student' && me?.batch ? [{ name: me.batch.name, sub: me.student?.roll_no ?? 'My batch' }]
    : []

  return (
    <div className="min-h-screen lg:flex">
      {/* -------------------------------------------------------- sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 p-4 pr-0 transition-[width] duration-300 lg:block',
          collapsed ? 'w-[104px]' : 'w-[272px]',
        )}
      >
        <div className="glass sheen flex h-full flex-col rounded-3xl py-5">
          <div className={cn('flex items-center px-5', collapsed && 'justify-center px-0')}>
            {collapsed ? <LogoMark /> : <Logo />}
          </div>

          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!collapsed}
            className={cn('mt-6 flex items-center gap-3 px-6 py-2 text-sm font-medium text-ink hover:text-brand-600', collapsed && 'justify-center px-0')}
          >
            <Menu className="h-5 w-5" />
            {!collapsed && 'Menu'}
          </button>

          <nav className="mt-2 flex-1" aria-label="Primary">
            <ul className="space-y-1">
              {nav.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 py-3 text-sm transition',
                        collapsed ? 'justify-center px-0' : 'px-6',
                        isActive ? 'font-medium text-brand-600' : 'text-ink-mute hover:text-brand-600',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                        {!collapsed && label}
                        {isActive && <span className="bg-grad absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-l-full" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {people.length > 0 && (
              <div className={cn('mt-8', collapsed ? 'px-0' : 'px-6')}>
                {!collapsed && <p className="mb-3 text-xs font-medium text-ink">{role === 'faculty' ? 'My batches' : 'My batch'}</p>}
                <ul className="space-y-3">
                  {people.map((p) => (
                    <li key={p.name} className={cn('flex items-center gap-3', collapsed && 'justify-center')} title={collapsed ? p.name : undefined}>
                      <Avatar name={p.name.replace(/^\d{4}\s+/, '')} ring className="h-10 w-10" />
                      {!collapsed && (
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{p.name}</p>
                          <p className="truncate text-[11px] text-ink-mute">{p.sub}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          <div className={cn('space-y-1', collapsed ? 'px-0' : 'px-3')}>
            <button onClick={() => setHelpOpen(true)} className={cn('flex w-full items-center gap-3 rounded-2xl py-2.5 text-sm text-ink-mute hover:text-brand-600', collapsed ? 'justify-center' : 'px-3')} aria-label="Help">
              <CircleHelp className="h-5 w-5" />{!collapsed && 'Help'}
            </button>
            <button onClick={signOut} className={cn('flex w-full items-center gap-3 rounded-2xl py-2.5 text-sm text-ink-mute hover:text-coral', collapsed ? 'justify-center' : 'px-3')} aria-label="Sign out">
              <LogOut className="h-5 w-5" />{!collapsed && 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* ------------------------------------------------------ top bar */}
        <header className="sticky top-0 z-30 px-4 pt-3 sm:px-6 lg:px-8 lg:pt-4">
          <div className="glass flex h-16 items-center gap-3 rounded-full pl-3 pr-2">
            <span className="lg:hidden"><LogoMark className="h-9 w-9 rounded-xl" /></span>
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-11 max-w-md flex-1 items-center justify-between rounded-full bg-[#F1F0F8]/90 pl-5 pr-1 text-left text-sm text-ink-mute transition hover:bg-white sm:flex"
              aria-label="Search (Ctrl+K)"
            >
              search something
              <span className="bg-grad grid h-9 w-9 place-items-center rounded-full text-white shadow-glow"><Search className="h-4 w-4" /></span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {DEMO_MODE && (
                <span className="hidden items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-medium text-brand-700 md:inline-flex" title="Sample data, saved only in this browser">
                  <FlaskConical className="h-3.5 w-3.5" /> Demo
                </span>
              )}
              <IconButton label="Search (Ctrl+K)" className="sm:hidden" onClick={() => setPaletteOpen(true)}><Search className="h-4 w-4" /></IconButton>
              <IconButton label="Refresh data" onClick={refresh}><RefreshCw className={cn('h-4 w-4', spinning && 'animate-spin')} /></IconButton>
              <div className="hidden text-right leading-tight md:block">
                <p className="text-[13px] font-medium">{me?.profile.full_name}</p>
                <p className="text-[11px] capitalize text-ink-mute">{role}</p>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        <main key={pathname} className="animate-fade-up px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------ mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-safe lg:hidden" aria-label="Primary">
        <ul className="glass-strong mx-auto mb-2 flex max-w-md items-center justify-around rounded-full px-2 py-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  cn('flex h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition', isActive ? 'text-brand-600' : 'text-ink-mute')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
                    <span className={cn('text-[10px] font-medium', !isActive && 'sr-only sm:not-sr-only')}>{label}</span>
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
              <span className="bg-grad grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white">{i + 1}</span>
              {tip}
            </li>
          ))}
          <li className="flex gap-3 text-sm text-ink-soft">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-700">⌘K</span>
            Press Ctrl+K (or ⌘K) anywhere to search and jump between pages.
          </li>
        </ol>
      </Modal>
    </div>
  )
}
