import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Building, GraduationCap, Hash, LogOut, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, Progress } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stars } from '@/components/ui/Stars'

export default function StudentProfile() {
  const { me, signOut } = useAuth()
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const att = useQuery({ queryKey: ['my-attendance'], queryFn: api.myAttendance })
  if (!me) return null

  const pct = att.data?.summary.attendance_pct ?? 0
  const offers = apps.data?.filter((a) => a.current_stage === 'offered').length ?? 0
  const rows = [
    { icon: Mail, label: 'Email', value: me.email },
    { icon: Hash, label: 'Roll number', value: me.student?.roll_no },
    { icon: Building, label: 'Department', value: me.student?.department },
    { icon: GraduationCap, label: 'Batch', value: me.batch?.name },
  ]

  return (
    <>
      <PageHeader eyebrow="Account" title="My profile" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* user profile card from the kit */}
        <Card className="p-6 lg:col-span-5">
          <p className="text-sm font-medium">user profile</p>
          <div className="mt-5 flex items-center gap-4">
            <Avatar name={me.profile.full_name} ring className="h-20 w-20" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{me.profile.full_name}</h2>
              <Stars value={(pct / 100) * 5} label="Attendance rating" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand">Student</Badge>
                {me.student?.is_fastrack && <Badge tone="success"><BadgeCheck className="h-3 w-3" />Fastrack</Badge>}
              </div>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="sr-only">{label}</span>
                <span className="truncate text-ink-soft">{value || '—'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2">
            <Button block variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={signOut}>sign out</Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-7">
          <Card>
            <CardHeader title="my numbers" />
            <dl className="grid grid-cols-3 gap-3 p-6">
              <div><dt className="text-[11px] text-ink-mute">applied</dt><dd className="num text-3xl text-brand-600">{apps.data?.length ?? '–'}</dd></div>
              <div><dt className="text-[11px] text-ink-mute">offers</dt><dd className="num text-3xl text-success">{offers}</dd></div>
              <div><dt className="text-[11px] text-ink-mute">attendance</dt><dd className={`num text-3xl ${pct >= 75 ? 'text-success' : 'text-warning'}`}>{att.data ? `${Math.round(pct)}%` : '–'}</dd></div>
            </dl>
            <div className="px-6 pb-6"><Progress value={pct} label="attendance target 75%" /></div>
          </Card>
          {!me.student && (
            <Card className="p-6 text-sm text-ink-soft">
              Your student details haven't been set up yet. Contact the placement cell to be added to a batch.
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
