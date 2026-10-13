import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, LogOut, RotateCcw, Repeat, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { resetDemo } from '@/components/DemoBanner'
import { DEMO_MODE } from '@/lib/config'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { me, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!me) return null
  const item = 'flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm text-ink hover:bg-brand-50 hover:text-brand-700'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-full transition hover:opacity-90">
        <Avatar name={me.profile.full_name} ring className="h-11 w-11" />
      </button>
      {open && (
        <div role="menu" className="glass-strong absolute right-0 top-[calc(100%+10px)] z-50 w-64 animate-fade-up rounded-3xl p-2">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <Avatar name={me.profile.full_name} ring className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{me.profile.full_name}</p>
              <p className="truncate text-xs text-ink-mute">{me.email}</p>
              <span className="mt-1 inline-block bg-grad rounded-full px-2 py-0.5 text-[10px] font-medium capitalize text-white">{me.profile.role}</span>
            </div>
          </div>
          <div className="h-px bg-line" />
          {me.profile.role === 'student' && (
            <Link to="/student/profile" className={item} onClick={() => setOpen(false)} role="menuitem"><UserRound className="h-4 w-4" />My profile</Link>
          )}
          {DEMO_MODE && (
            <>
              <button className={item} onClick={signOut} role="menuitem"><Repeat className="h-4 w-4" />Switch demo role</button>
              <button className={item} onClick={resetDemo} role="menuitem"><RotateCcw className="h-4 w-4" />Reset demo data</button>
              <p className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-[11px] text-ink-mute"><FlaskConical className="h-3 w-3" />Demo data is saved in this browser only.</p>
            </>
          )}
          <div className="h-px bg-line" />
          <button className={`${item} text-coral`} onClick={signOut} role="menuitem"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      )}
    </div>
  )
}
