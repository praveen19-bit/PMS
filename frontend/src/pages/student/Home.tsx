import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowUpRight, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import type { AttendanceRecord } from '@/lib/types'
import { stageLabel, stageTone } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useApply } from '@/hooks/useApply'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { SphereArt } from '@/components/ui/SphereArt'
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from '@/components/ui/States'
import { DriveCard } from '@/components/DriveCard'
import { AttendanceStrip } from '@/components/AttendanceGrid'
import { applicationIsActive } from '@/components/ApplicationTimeline'
import { AXIS, ChartTooltip, ChipLabel, hatchDefs, LIME } from '@/components/charts'

/** % present per ISO week for the last 5 weeks with records, oldest first. */
function weeklyPresence(records: AttendanceRecord[]) {
  const weeks = new Map<string, { present: number; total: number }>()
  for (const r of records) {
    const d = new Date(`${r.date}T00:00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday of that week
    const key = d.toISOString().slice(0, 10)
    const w = weeks.get(key) ?? { present: 0, total: 0 }
    w.total += 1
    if (r.status === 'present') w.present += 1
    weeks.set(key, w)
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([monday, w], i, arr) => ({
      name: i === arr.length - 1 ? 'This wk' : new Date(`${monday}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      pct: Math.round((100 * w.present) / w.total),
    }))
}

export default function StudentHome() {
  const { me } = useAuth()
  const firstName = me?.profile.full_name.split(' ')[0] ?? ''
  const attendance = useQuery({ queryKey: ['my-attendance'], queryFn: api.myAttendance })
  const drives = useQuery({ queryKey: ['drives', 'upcoming-eligible'], queryFn: () => api.drives({ upcoming: true, eligible_only: true }) })
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const apply = useApply()

  const s = attendance.data?.summary
  const weekly = useMemo(() => weeklyPresence(attendance.data?.records ?? []), [attendance.data])
  const active = apps.data?.filter(applicationIsActive) ?? []
  const offers = apps.data?.filter((a) => a.current_stage === 'offered') ?? []
  const openDrives = drives.data?.filter((d) => !d.applied) ?? []
  const total = apps.data?.length ?? 0
  const bars = [
    { label: 'Applied', value: total },
    { label: 'In progress', value: active.length },
    { label: 'Offers', value: offers.length },
  ]
  const maxBar = Math.max(1, ...bars.map((b) => b.value))

  return (
    <>
      <PageHeader
        back={false}
        eyebrow={me?.batch ? `${me.batch.name} · ${me.student?.roll_no}` : 'Student'}
        title={<>Hello, {firstName}<span className="text-ink-mute">.</span></>}
        subtitle="Your placement journey at a glance."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* Hero: sphere art with a glass overlay, like the reference "Pro" card */}
        <Card className="relative overflow-hidden lg:col-span-5 lg:row-span-2">
          <SphereArt className="pointer-events-none absolute -right-6 -top-4 h-64 w-[115%] sm:h-72" />
          <div className="relative flex h-full min-h-[420px] flex-col p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium">Placement snapshot</span>
              {offers.length > 0 && <Badge tone="success"><Trophy className="h-3 w-3" />{offers.length} offer{offers.length > 1 ? 's' : ''}</Badge>}
            </div>
            <div className="glass-strong mt-auto rounded-4xl p-4">
              <p className="text-sm font-medium">{offers.length ? `Offer from ${offers.map((o) => o.drive?.company_name).join(', ')}` : 'Keep going — every round counts'}</p>
              <p className="text-xs text-ink-mute">Applications this season</p>
              {apps.isPending ? <Skeleton className="mt-4 h-32" /> : (
                <div className="mt-4 grid grid-cols-3 items-end gap-3">
                  {bars.map((b, i) => (
                    <div key={b.label} className="flex flex-col items-center gap-2">
                      <div className="flex h-28 w-full items-end">
                        <div
                          className={i === 2 ? 'w-full rounded-[18px] bg-lime' : 'w-full rounded-[18px] bg-white/70 bg-hatch ring-1 ring-ink/10'}
                          style={{ height: `${Math.max(32, (b.value / maxBar) * 100)}%` }}
                        >
                          <p className="num px-2 pt-1.5 text-center text-lg">{b.value}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-ink-mute">{b.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Attendance */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Attendance"
            subtitle="Share of days present, by week"
            action={s && <Badge tone={s.attendance_pct >= 75 ? 'success' : s.total_marked ? 'danger' : 'neutral'}>{s.attendance_pct >= 75 ? 'On track' : s.total_marked ? 'Below 75%' : 'No records'}</Badge>}
          />
          {attendance.isPending ? <div className="p-5"><Skeleton className="h-40" /></div> : attendance.isError ? (
            <p className="p-5 text-sm text-rose-600">{attendance.error.message}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 pt-3 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-start sm:gap-3">
                <div>
                  <p className="text-[11px] text-ink-mute">Overall</p>
                  <p className="num text-5xl">{Math.round(s!.attendance_pct)}<span className="text-2xl text-ink-mute">%</span></p>
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:flex-col sm:gap-1.5">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-lime" /><dt className="text-ink-mute">Present</dt><dd className="font-medium tabular-nums">{s!.present_count}</dd></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-ink" /><dt className="text-ink-mute">Absent</dt><dd className="font-medium tabular-nums">{s!.absent_count}</dd></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white bg-hatch ring-1 ring-ink/15" /><dt className="text-ink-mute">Leave</dt><dd className="font-medium tabular-nums">{s!.leave_count}</dd></div>
                </dl>
              </div>
              {weekly.length > 0 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly} margin={{ top: 30, right: 4, left: 4, bottom: 0 }}>
                      {hatchDefs('wk-hatch')}
                      <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.4)' }} content={<ChartTooltip suffix="% present" />} />
                      <Bar dataKey="pct" radius={[12, 12, 12, 12]} maxBarSize={44}>
                        {weekly.map((w, i) => <Cell key={w.name} fill={i === weekly.length - 1 ? LIME : 'url(#wk-hatch)'} stroke="rgba(17,18,20,0.08)" />)}
                        <LabelList dataKey="pct" content={(p) => <ChipLabel {...(p as object)} highlight={weekly.length - 1} suffix="%" />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="self-center text-sm text-ink-mute">No attendance recorded yet.</p>}
              <div className="sm:col-span-2"><AttendanceStrip records={attendance.data!.records} /></div>
            </div>
          )}
        </Card>

        {/* In progress */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="In progress"
            subtitle={`${active.length} active application${active.length === 1 ? '' : 's'}`}
            action={<Link to="/student/applications"><IconButton label="All applications" size="sm"><ArrowUpRight className="h-4 w-4" /></IconButton></Link>}
          />
          {apps.isPending ? <div className="p-5"><Skeleton className="h-16" /></div> : active.length === 0 ? (
            <p className="px-5 pb-6 pt-3 text-sm text-ink-mute">No active applications yet. Apply to a drive below to get started.</p>
          ) : (
            <ul className="space-y-1.5 p-3">
              {active.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link to={`/student/applications#${a.id}`} className="flex items-center gap-3 rounded-3xl bg-white/50 px-3 py-2.5 transition hover:bg-white/90">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-lime">{a.drive?.company_name.charAt(0)}</span>
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
      </div>

      {/* Open drives */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-light tracking-tight">Open drives for you</h2>
            <p className="text-xs text-ink-mute">Matching your department</p>
          </div>
          <Link to="/student/drives" className="text-sm font-medium text-ink underline-offset-4 hover:underline">Browse all</Link>
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
