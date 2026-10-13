import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Briefcase, CalendarCheck, Sparkles, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useApply } from '@/hooks/useApply'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from '@/components/ui/States'
import { DriveCard } from '@/components/DriveCard'
import { AttendanceStrip } from '@/components/AttendanceGrid'
import { applicationIsActive } from '@/components/ApplicationTimeline'
import { stageLabel, stageTone } from '@/lib/format'

function AttendanceRing({ pct }: { pct: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0" stopColor="#14B8A6" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#EEF0F5" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (Math.min(pct, 100) / 100) * c} className="transition-[stroke-dashoffset] duration-700" />
    </svg>
  )
}

export default function StudentHome() {
  const { me } = useAuth()
  const firstName = me?.profile.full_name.split(' ')[0] ?? ''
  const attendance = useQuery({ queryKey: ['my-attendance'], queryFn: api.myAttendance })
  const drives = useQuery({ queryKey: ['drives', 'upcoming-eligible'], queryFn: () => api.drives({ upcoming: true, eligible_only: true }) })
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const apply = useApply()

  const s = attendance.data?.summary
  const active = apps.data?.filter(applicationIsActive) ?? []
  const offers = apps.data?.filter((a) => a.current_stage === 'offered') ?? []
  const openDrives = drives.data?.filter((d) => !d.applied) ?? []

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-ink-mute">Hello, {firstName} 👋</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Your placement <span className="text-accent-gradient">journey</span>
        </h1>
        {me?.batch && <p className="mt-1 text-sm text-ink-mute">{me.batch.name} · {me.student?.roll_no}</p>}
      </section>

      {offers.length > 0 && (
        <Card className="flex items-center gap-3 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
          <Trophy className="h-8 w-8 shrink-0 text-emerald-500" />
          <div>
            <p className="font-bold text-emerald-800">Congratulations! 🎉</p>
            <p className="text-sm text-emerald-700">Offer from {offers.map((o) => o.drive?.company_name).join(', ')}</p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><CalendarCheck className="h-5 w-5 text-brand-500" />Attendance</h2>
            {s && <Badge tone={s.attendance_pct >= 75 ? 'success' : s.total_marked ? 'danger' : 'neutral'}>{s.attendance_pct >= 75 ? 'On track' : s.total_marked ? 'Below 75%' : 'No records'}</Badge>}
          </div>
          {attendance.isPending ? (
            <Skeleton className="mt-4 h-24" />
          ) : attendance.isError ? (
            <p className="mt-4 text-sm text-rose-600">{attendance.error.message}</p>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative">
                  <AttendanceRing pct={s!.attendance_pct} />
                  <span className="absolute inset-0 grid place-items-center text-xl font-extrabold">{Math.round(s!.attendance_pct)}%</span>
                </div>
                <dl className="grid flex-1 grid-cols-3 gap-2 text-center">
                  {[
                    ['Present', s!.present_count, 'text-emerald-600'],
                    ['Absent', s!.absent_count, 'text-rose-600'],
                    ['Leave', s!.leave_count, 'text-amber-600'],
                  ].map(([label, n, cls]) => (
                    <div key={label as string} className="rounded-xl bg-canvas py-2">
                      <dd className={`text-lg font-extrabold ${cls}`}>{n}</dd>
                      <dt className="text-[11px] font-medium text-ink-mute">{label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-4"><AttendanceStrip records={attendance.data!.records} /></div>
            </>
          )}
        </Card>

        {/* Active applications */}
        <Card className="pb-2">
          <CardHeader
            title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-500" />In progress</span>}
            action={<Link to="/student/applications" className="text-sm font-semibold text-brand-600">View all</Link>}
          />
          {apps.isPending ? (
            <div className="p-5"><Skeleton className="h-16" /></div>
          ) : active.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-mute">No active applications yet. Apply to a drive below to get started.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {active.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link to={`/student/applications#${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{a.drive?.company_name}</p>
                      <p className="truncate text-xs text-ink-mute">{a.drive?.role_offered}</p>
                    </div>
                    <Badge tone={stageTone(a.current_stage)}>{stageLabel(a.current_stage)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Open drives */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-brand-500" />Open drives for you</h2>
          <Link to="/student/drives" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            Browse <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {drives.isPending ? (
          <ListSkeleton rows={2} />
        ) : drives.isError ? (
          <ErrorState message={drives.error.message} action={{ label: 'Retry', onClick: () => drives.refetch() }} />
        ) : openDrives.length === 0 ? (
          <EmptyState title="You're all caught up" message="No new drives match your profile right now. We'll list them here as soon as they're posted." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {openDrives.slice(0, 4).map((d) => (
              <DriveCard key={d.id} drive={d} compact onApply={apply.mutate} applying={apply.isPending && apply.variables?.id === d.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
