import { BarChart3, ChevronRight, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { DEMO_PASSWORD } from '@/lib/demo/store'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/types'

const DEMO_USERS: { id: string; role: Role; name: string; email: string; icon: typeof Users }[] = [
  { id: 'u-stu-cse-a-1', role: 'student', name: 'Ananya Iyer', email: 'ananya@demo.edu', icon: GraduationCap },
  { id: 'u-fac1', role: 'faculty', name: 'Dr. Meera Krishnan', email: 'meera@demo.edu', icon: Users },
  { id: 'u-dean', role: 'dean', name: 'Prof. S. Raman', email: 'dean@demo.edu', icon: BarChart3 },
  { id: 'u-admin', role: 'admin', name: 'Placement Admin', email: 'admin@demo.edu', icon: ShieldCheck },
]

export function DemoRolePicker() {
  const { signInAs } = useAuth()
  return (
    <div>
      <p className="label">Try the demo as</p>
      <ul className="grid grid-cols-2 gap-2">
        {DEMO_USERS.map(({ id, role, name, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => signInAs(id)}
              aria-label={`${role} · ${name}`}
              className="group flex w-full items-center gap-2.5 rounded-2xl bg-subtle/70 p-2.5 text-left transition hover:bg-brand-50 hover:ring-1 hover:ring-brand-200"
            >
              <span className="bg-grad grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-glow"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize">{role}</span>
                <span className="block truncate text-[11px] text-ink-mute">{name}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-brand-300 transition group-hover:text-brand-600" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-mute">
        Or use a demo email (e.g. <span className="text-brand-600">{DEMO_USERS[0]!.email}</span>) with password <span className="text-brand-600">{DEMO_PASSWORD}</span>.
      </p>
    </div>
  )
}
