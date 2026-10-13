import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronRight, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import type { AttendanceRecord } from '@/lib/types'
import { fmtDate, stageLabel, stageTone, todayISO } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useApply } from '@/hooks/useApply'
import { Card, CardHeader, Progress } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from '@/components/ui/States'
import { DriveCard } from '@/components/DriveCard'
import { WeekStrip } from '@/components/WeekStrip'
import { applicationIsActive } from '@/components/ApplicationTimeline'
import { AXIS, ChartTooltip, GRID, gradientDefs, VIOLET } from '@/components/charts'

/** % present per week for the last 6 weeks with records, oldest first. */
function weeklyPresence(records: AttendanceRecord[]) {
  const weeks = new Map<string, { present: number; total: number }>()
  for (const r of records) {
    const d = new Date(`${r.date}T00:00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = d.toISOString().slice(0, 10)
    const w = weeks.get(key) ?? { present: 0, total: 0 }
    w.total += 1
    if (r.status === 'present') w.present += 1
    weeks.set(key, w)
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monday, w]) => ({ name: fmtDate(monday, { day: 'numeric', month: 'short' }), pct: Math.round((100 * w.present) / w.total) }))
}

export default function StudentHome() {
  const { me } = useAuth()
  const firstName = me?.profile.full_name.split(' ')[0] ?? ''
  const attendance = useQuery({ queryKey: ['my-attendance'], queryFn: api.myAttendance })
  const drives = useQuery({ queryKey: ['drives', 'upcoming-eligible'], queryFn: () => api.drives({ upcoming: true, eligible_only: true }) })
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const apply = useApply()
  const [day, setDay] = useState(todayISO())

  const s = attendance.data?.summary
  const weekly = useMemo(() => weeklyPresence(attendance.data?.records ?? []), [attendance.data])
  const active = apps.data?.filter(applicationIsActive) ?? []
  const offers = apps.data?.filter((a) => a.current_stage === 'offered') ?? []
  const upcoming = drives.data ?? []
  const openDrives = upcoming.filter((d) => !d.applied)
  const driveDays = useMemo(() => new Set(upcoming.map((d) => d.drive_date).filter(Boolean) as string[]), [upcoming])
  const onDay = upcoming.filter((d) => d.drive_date === day)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-brand-600 sm:text-3xl">Hi, {firstName}.</h1>
        <p className="mt-1 text-sm text-ink-mute">{me?.batch ? `${me.batch.name} · ${me.student?.roll_no}` : 'Your placement journey at a glance.'}</p>
      </div>

      {offers.length > 0 && (
        <Card className="mb-4 flex items-center gap-3 p-4">
          <span className="bg-grad grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-glow"><Trophy className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold text-brand-600">Congratulations!</p>
            <p className="text-sm text-ink-soft">Offer from {offers.map((o) => o.drive?.company_name).join(', ')}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* highlight update: upcoming drives as story circles */}
        <Card className="lg:col-span-7">
          <CardHeader title="upcoming drives" subtitle="Tap to browse and apply" />
          {drives.isPending ? <div className="p-5"><Skeleton className="h-20" /></div> : upcoming.length === 0 ? (
            <p className="px-5 pb-5 pt-3 text-sm text-ink-mute">No upcoming drives for your department yet.</p>
          ) : (
            <div className="flex items-center gap-2 px-3 pb-4 pt-3">
              <ul className="flex flex-1 gap-4 overflow-x-auto px-2 pb-1 scrollbar-none">
                {upcoming.slice(0, 8).map((d) => (
                  <li key={d.id} className="shrink-0">
                    <Link to="/student/drives" className="flex w-16 flex-col items-center gap-1.5 text-center">
                      <Avatar name={d.company_name} ring className="h-14 w-14" />
                      <span className="w-full truncate text-[11px] text-ink-soft">{d.company_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/student/drives" aria-label="All drives" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-600 hover:bg-brand-50">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </Card>

        {/* in progress */}
        <Card className="lg:col-span-5">
          <CardHeader title="in progress" subtitle={`${active.length} active application${active.length === 1 ? '' : 's'}`}
            action={<Link to="/student/applications" className="text-xs font-medium text-brand-600">view all</Link>} />
          {apps.isPending ? <div className="p-5"><Skeleton className="h-16" /></div> : active.length === 0 ? (
            <p className="px-5 pb-5 pt-3 text-sm text-ink-mute">No active applications yet.</p>
          ) : (
            <ul className="p-3">
              {active.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link to={`/student/applications#${a.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-brand-50">
                    <Avatar name={a.drive?.company_name ?? '?'} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.drive?.company_name}</p>
                      <p className="truncate text-xs text-ink-mute">{a.drive?.role_offered}</p>
                    </div>
                    <Badge tone={stageTone(a.current_stage)}>{stageLabel(a.current_stage)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* graphic update: attendance trend */}
        <Card className="lg:col-span-7">
          <CardHeader title="attendance update" subtitle="Share of days present, by week" />
          {attendance.isPending ? <div className="p-5"><Skeleton className="h-56" /></div> : attendance.isError ? (
            <p className="p-5 text-sm text-coral">{attendance.error.message}</p>
          ) : (
            <div className="p-5 pt-2">
              {weekly.length > 1 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekly} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
                      {gradientDefs('att')}
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ stroke: '#DACEFF' }} content={<ChartTooltip suffix="% present" />} />
                      <Area type="monotone" dataKey="pct" stroke={VIOLET} strokeWidth={3} fill="url(#att-area)"
                        activeDot={{ r: 6, fill: '#fff', stroke: '#6A3DE8', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-10 text-center text-sm text-ink-mute">Not enough attendance yet for a trend.</p>}

              <dl className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: 'overall', value: `${Math.round(s!.attendance_pct)}%`, cls: 'text-brand-600' },
                  { label: 'present', value: s!.present_count, cls: 'text-pink' },
                  { label: 'leave', value: s!.leave_count, cls: 'text-amber' },
                  { label: 'absent', value: s!.absent_count, cls: 'text-coral' },
                ].map((x) => (
                  <div key={x.label}>
                    <dt className="text-[11px] text-ink-mute">{x.label}</dt>
                    <dd className={`num text-xl ${x.cls}`}>{x.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4"><Progress value={s!.attendance_pct} label="attendance target 75%" /></div>
            </div>
          )}
        </Card>

        {/* schedule: drive calendar */}
        <Card className="lg:col-span-5">
          <CardHeader title="schedule" subtitle="Dots mark drive days" />
          <div className="p-4 pt-3">
            <WeekStrip value={day} onChange={setDay} marked={driveDays} />
            <div className="mt-4 space-y-2">
              {onDay.length === 0 ? (
                <p className="rounded-2xl bg-[#F6F5FC] px-4 py-3 text-center text-xs text-ink-mute">No drives on {fmtDate(day, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              ) : onDay.map((d) => (
                <Link key={d.id} to="/student/drives" className="flex items-center gap-3 rounded-2xl bg-brand-50 px-3 py-2.5">
                  <Avatar name={d.company_name} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.company_name}</p>
                    <p className="truncate text-xs text-ink-mute">{d.role_offered}</p>
                  </div>
                  {d.applied ? <Badge tone="brand">Applied</Badge> : <ChevronRight className="h-4 w-4 text-brand-500" />}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Open drives for you</h2>
            <p className="text-xs text-ink-mute">Matching your department</p>
          </div>
          <Link to="/student/drives" className="text-sm font-medium text-brand-600">browse all</Link>
        </div>
        {drives.isPending ? <ListSkeleton rows={2} /> : drives.isError ? (
          <ErrorState message={drives.error.message} action={{ label: 'Retry', onClick: () => drives.refetch() }} />
        ) : openDrives.length === 0 ? (
          <EmptyState title="You're all caught up" message="No new drives match your profile right now. They'll appear here as soon as they're posted." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {openDrives.slice(0, 6).map((d) => (
              <DriveCard key={d.id} drive={d} compact onApply={apply.mutate} applying={apply.isPending && apply.variables?.id === d.id} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
