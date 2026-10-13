import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Building, GraduationCap, Hash, LogOut, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { SphereArt } from '@/components/ui/SphereArt'

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
  const stats = [
    { label: 'Applied', value: apps.data?.length ?? '–' },
    { label: 'Offers', value: apps.data?.filter((a) => a.current_stage === 'offered').length ?? '–' },
    { label: 'Attendance', value: att.data ? `${Math.round(att.data.summary.attendance_pct)}%` : '–' },
  ]

  return (
    <>
      <PageHeader eyebrow="Profile" title="My profile" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="relative overflow-hidden lg:col-span-5">
          <SphereArt seed={21} className="pointer-events-none absolute -right-10 -top-10 h-56 w-[120%]" />
          <div className="relative p-5 pt-40">
            <div className="glass-strong rounded-4xl p-5">
              <div className="flex items-center gap-4">
                <Avatar name={me.profile.full_name} className="h-16 w-16 text-lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-2xl font-light tracking-tight">{me.profile.full_name}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="brand">Student</Badge>
                    {me.student?.is_fastrack && <Badge tone="success"><BadgeCheck className="h-3 w-3" />Fastrack</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {stats.map((s, i) => (
                  <div key={s.label} className={`rounded-3xl px-3 py-3 ${i === 1 ? 'bg-lime text-lime-ink' : 'bg-white/70'}`}>
                    <p className="num text-2xl">{s.value}</p>
                    <p className="text-[11px] opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-7">
          <Card>
            <ul className="divide-y divide-line">
              {rows.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-center gap-3 px-5 py-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/80"><Icon className="h-4 w-4" /></span>
                  <span className="text-sm text-ink-mute">{label}</span>
                  <span className="ml-auto truncate text-sm font-medium">{value || '—'}</span>
                </li>
              ))}
            </ul>
          </Card>
          {!me.student && (
            <p className="glass rounded-3xl p-4 text-sm text-ink-soft">
              Your student details haven't been set up yet. Contact the placement cell to be added to a batch.
            </p>
          )}
          <Button variant="danger" block size="lg" icon={<LogOut className="h-4 w-4" />} onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </>
  )
}
