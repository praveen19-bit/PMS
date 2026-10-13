import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Building, GraduationCap, Hash, LogOut, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function StudentProfile() {
  const { me, signOut } = useAuth()
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const att = useQuery({ queryKey: ['my-attendance'], queryFn: api.myAttendance })
  if (!me) return null

  const rows = [
    { icon: Mail, label: 'Email', value: me.email },
    { icon: Hash, label: 'Roll number', value: me.student?.roll_no },
    { icon: Building, label: 'Department', value: me.student?.department },
    { icon: GraduationCap, label: 'Batch', value: me.batch?.name },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card className="relative overflow-hidden p-6 text-center">
        <div className="absolute inset-x-0 top-0 h-20 bg-brand-gradient" />
        <Avatar name={me.profile.full_name} className="relative mx-auto mt-6 h-20 w-20 border-4 border-white text-xl" />
        <h1 className="mt-3 text-xl font-extrabold">{me.profile.full_name}</h1>
        <div className="mt-2 flex justify-center gap-2">
          <Badge tone="brand">Student</Badge>
          {me.student?.is_fastrack && <Badge tone="success"><BadgeCheck className="h-3.5 w-3.5" />Fastrack</Badge>}
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl bg-canvas py-3">
          <div><p className="text-lg font-extrabold">{apps.data?.length ?? '–'}</p><p className="text-[11px] text-ink-mute">Applied</p></div>
          <div><p className="text-lg font-extrabold">{apps.data?.filter((a) => a.current_stage === 'offered').length ?? '–'}</p><p className="text-[11px] text-ink-mute">Offers</p></div>
          <div><p className="text-lg font-extrabold">{att.data ? `${Math.round(att.data.summary.attendance_pct)}%` : '–'}</p><p className="text-[11px] text-ink-mute">Attendance</p></div>
        </div>
      </Card>

      <Card>
        <ul className="divide-y divide-line">
          {rows.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon className="h-4 w-4 text-brand-500" />
              <span className="text-sm text-ink-mute">{label}</span>
              <span className="ml-auto truncate text-sm font-semibold">{value || '—'}</span>
            </li>
          ))}
        </ul>
      </Card>

      {!me.student && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Your student details haven't been set up yet. Contact the placement cell to be added to a batch.
        </p>
      )}

      <Button variant="danger" block icon={<LogOut className="h-4 w-4" />} onClick={signOut}>Sign out</Button>
    </div>
  )
}
