import { BarChart3, ChevronRight, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { DEMO_PASSWORD } from '@/lib/demo/store'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/types'

const DEMO_USERS: { id: string; role: Role; name: string; email: string; blurb: string; icon: typeof Users }[] = [
  { id: 'u-stu-cse-a-1', role: 'student', name: 'Ananya Iyer', email: 'ananya@demo.edu', blurb: 'Attendance, drives, application timeline', icon: GraduationCap },
  { id: 'u-fac1', role: 'faculty', name: 'Dr. Meera Krishnan', email: 'meera@demo.edu', blurb: 'Mark attendance, update interview stages', icon: Users },
  { id: 'u-dean', role: 'dean', name: 'Prof. S. Raman', email: 'dean@demo.edu', blurb: 'Analytics, post drives, assign faculty', icon: BarChart3 },
  { id: 'u-admin', role: 'admin', name: 'Placement Admin', email: 'admin@demo.edu', blurb: 'Manage users, roles and batches', icon: ShieldCheck },
]

export function DemoRolePicker() {
  const { signInAs } = useAuth()
  return (
    <div>
      <p className="label">Try it as</p>
      <ul className="space-y-2">
        {DEMO_USERS.map(({ id, role, name, blurb, icon: Icon }) => (
          <li key={id}>
            <button
              onClick={() => signInAs(id)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-card transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold capitalize">{role} <span className="font-medium text-ink-mute">· {name}</span></span>
                <span className="block truncate text-xs text-ink-mute">{blurb}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-mute">
        Or sign in below with any demo email (e.g. <code>{DEMO_USERS[0]!.email}</code>) and password <code>{DEMO_PASSWORD}</code>.
        Users the admin creates can sign in too.
      </p>
    </div>
  )
}
