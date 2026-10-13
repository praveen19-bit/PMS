import { ArrowUpRight, BarChart3, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { DEMO_PASSWORD } from '@/lib/demo/store'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/types'

const DEMO_USERS: { id: string; role: Role; name: string; email: string; blurb: string; icon: typeof Users }[] = [
  { id: 'u-stu-cse-a-1', role: 'student', name: 'Ananya Iyer', email: 'ananya@demo.edu', blurb: 'Attendance, drives, timeline', icon: GraduationCap },
  { id: 'u-fac1', role: 'faculty', name: 'Dr. Meera Krishnan', email: 'meera@demo.edu', blurb: 'Attendance & interviews', icon: Users },
  { id: 'u-dean', role: 'dean', name: 'Prof. S. Raman', email: 'dean@demo.edu', blurb: 'Analytics & drives', icon: BarChart3 },
  { id: 'u-admin', role: 'admin', name: 'Placement Admin', email: 'admin@demo.edu', blurb: 'Users & batches', icon: ShieldCheck },
]

export function DemoRolePicker() {
  const { signInAs } = useAuth()
  return (
    <div>
      <p className="label">Try it as</p>
      <ul className="grid grid-cols-2 gap-2">
        {DEMO_USERS.map(({ id, role, name, blurb, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => signInAs(id)}
              aria-label={`${role} · ${name}`}
              className="glass sheen group flex h-full w-full flex-col rounded-3xl p-3.5 text-left transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              <span className="flex w-full items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-lime"><Icon className="h-4 w-4" /></span>
                <ArrowUpRight className="h-4 w-4 text-ink-mute transition group-hover:text-ink" />
              </span>
              <span className="mt-3 block text-sm font-medium capitalize">{role}</span>
              <span className="block truncate text-[11px] text-ink-mute">{name}</span>
              <span className="mt-0.5 hidden truncate text-[11px] text-ink-mute sm:block">{blurb}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-mute">
        Or sign in with a demo email (e.g. <code className="text-ink-soft">{DEMO_USERS[0]!.email}</code>) and password <code className="text-ink-soft">{DEMO_PASSWORD}</code>.
      </p>
    </div>
  )
}
