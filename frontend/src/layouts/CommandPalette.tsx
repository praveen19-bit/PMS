import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, LogOut, Moon, RefreshCw, Search, Sun, type LucideIcon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/components/ui/cn'
import type { NavItem } from './nav'

export interface PaletteAction { label: string; icon: LucideIcon; run: () => void }

interface Props {
  open: boolean
  onClose: () => void
  nav: NavItem[]
  onRefresh: () => void
  onSignOut: () => void
}

/** ⌘K / Ctrl+K quick switcher for pages and common actions. */
export function CommandPalette({ open, onClose, nav, onRefresh, onSignOut }: Props) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const { theme, toggle } = useTheme()

  const items = useMemo<PaletteAction[]>(() => {
    const all: PaletteAction[] = [
      ...nav.map((n) => ({ label: `Go to ${n.label}`, icon: n.icon, run: () => navigate(n.to) })),
      { label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: theme === 'dark' ? Sun : Moon, run: toggle },
      { label: 'Refresh data', icon: RefreshCw, run: onRefresh },
      { label: 'Sign out', icon: LogOut, run: onSignOut },
    ]
    const needle = q.trim().toLowerCase()
    return needle ? all.filter((a) => a.label.toLowerCase().includes(needle)) : all
  }, [nav, q, navigate, onRefresh, onSignOut, theme, toggle])

  useEffect(() => { if (open) { setQ(''); setActive(0) } }, [open])
  useEffect(() => setActive(0), [q])

  if (!open) return null
  const run = (a?: PaletteAction) => { if (!a) return; onClose(); a.run() }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 overlay backdrop-blur-[6px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search" className="glass-strong sheen relative w-full max-w-lg animate-fade-up rounded-3xl p-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <Search className="h-4 w-4 text-brand-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
              if (e.key === 'Enter') run(items[active])
            }}
            placeholder="Search pages and actions…"
            className="h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-mute"
            aria-label="Search pages and actions"
          />
          <kbd className="rounded-md bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-mute ring-1 ring-line">Esc</kbd>
        </div>
        <div className="h-px bg-line" />
        <ul className="max-h-80 overflow-y-auto py-1" role="listbox">
          {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-mute">No matches</li>}
          {items.map((a, i) => (
            <li key={a.label} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => run(a)}
                className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm', i === active && 'bg-subtle')}
              >
                <span className={cn('grid h-8 w-8 place-items-center rounded-full', i === active ? 'bg-grad text-white' : 'bg-subtle text-ink-soft')}><a.icon className="h-4 w-4" /></span>
                <span className="flex-1">{a.label}</span>
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-mute" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
