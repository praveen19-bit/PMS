import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  BarChart3, Briefcase, CalendarCheck, GraduationCap, Layers, Link2, Menu, MessagesSquare, Users, X,
} from 'lucide-react'
import { Sidebar } from '@/components/ui/Sidebar'
import { Logo } from '@/components/ui/Logo'
import type { NavItem } from '@/components/ui/nav'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/types'

const NAV: Record<Exclude<Role, 'student'>, NavItem[]> = {
  faculty: [
    { to: '/faculty/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/faculty/students', label: 'Students', icon: GraduationCap },
    { to: '/faculty/interviews', label: 'Interviews', icon: MessagesSquare },
  ],
  dean: [
    { to: '/dean/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dean/drives', label: 'Drives', icon: Briefcase },
    { to: '/dean/assignments', label: 'Assignments', icon: Link2 },
  ],
  admin: [
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/batches', label: 'Batches', icon: Layers },
    { to: '/dean/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dean/drives', label: 'Drives', icon: Briefcase },
    { to: '/dean/assignments', label: 'Assignments', icon: Link2 },
  ],
}

export function StaffLayout() {
  const { me, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const role = (me?.profile.role ?? 'faculty') as Exclude<Role, 'student'>
  const sidebar = (
    <Sidebar
      items={NAV[role] ?? []}
      name={me?.profile.full_name ?? ''}
      roleLabel={role}
      onSignOut={signOut}
      onNavigate={() => setOpen(false)}
    />
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line bg-white lg:block">{sidebar}</aside>
      <div className="min-w-0 flex-1">
        {/* Mobile / tablet top bar + drawer */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur-lg lg:hidden">
          <Logo />
          <button onClick={() => setOpen(true)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-5 rounded-full p-2 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="relative overflow-x-hidden">
          <div className="blob -right-32 -top-32 h-80 w-80 bg-brand-200/40" />
          <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
