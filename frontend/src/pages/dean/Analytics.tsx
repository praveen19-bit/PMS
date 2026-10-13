import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpDown, Briefcase, GraduationCap, Plus, Send, Table2, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { stageLabel } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, Progress, StatCard } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { AXIS, ChartTooltip, ChipLabel, GRID, gradientDefs, VIOLET, VIOLET_SOFT } from '@/components/charts'

const SHORT: Record<string, string> = { applied: 'Applied', shortlisted: 'Shortlisted', round1_completed: 'Round 1', hr_round: 'HR round', offered: 'Offer' }

export default function DeanAnalytics() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: api.analytics })
  const [attTable, setAttTable] = useState(false)
  const [sortDesc, setSortDesc] = useState(false)

  if (q.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-80" />
      </div>
    )
  if (q.isError) return <ErrorState message={q.error.message} action={{ label: 'Retry', onClick: () => q.refetch() }} />

  const { totals, batch_attendance, funnel, stage_counts } = q.data
  let att = batch_attendance.map((b) => ({ name: b.batch_name, pct: Number(b.attendance_pct), students: b.student_count, marked: b.total_marked }))
  if (sortDesc) att = [...att].sort((a, b) => b.pct - a.pct)
  const best = att.reduce((bi, b, i, arr) => (b.pct > arr[bi]!.pct ? i : bi), 0)
  const funnelData = funnel.map((f) => ({ name: stageLabel(f.stage), short: SHORT[f.stage] ?? stageLabel(f.stage), count: f.count }))
  const placementRate = totals.students ? Math.round((totals.offers / totals.students) * 100) : 0
  const maxStage = Math.max(1, ...stage_counts.map((s) => s.count))

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Placement analytics"
        subtitle="Attendance and placement progress across all batches."
        action={
          <>
            <Link to="/dean/assignments"><Button variant="secondary">Assign faculty</Button></Link>
            <Link to="/dean/drives"><Button icon={<Plus className="h-4 w-4" />}>Post a drive</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="students" value={totals.students} hint={`${totals.batches} batches`} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="drives" value={totals.drives} pink icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="applications" value={totals.applications} tone="warning" icon={<Send className="h-4 w-4" />} />
        <StatCard label="offers" value={totals.offers} tone="danger" hint={`${placementRate}% of students`} icon={<Trophy className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* graphic update: funnel */}
        <Card className="lg:col-span-7">
          <CardHeader title="placement funnel" subtitle="Applications at or beyond each stage" />
          {totals.applications === 0 ? <div className="p-5"><EmptyState title="No applications yet" /></div> : (
            <div className="p-5 pt-2">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={funnelData} margin={{ top: 34, right: 12, left: -18, bottom: 0 }}>
                    {gradientDefs('fun')}
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="short" tick={AXIS} tickLine={false} axisLine={false} interval={0} padding={{ left: 10, right: 10 }} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: VIOLET_SOFT }} content={<ChartTooltip suffix=" applications" />} />
                    <Area type="monotone" dataKey="count" stroke={VIOLET} strokeWidth={3} fill="url(#fun-area)"
                      dot={{ r: 4, fill: '#fff', stroke: VIOLET, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: '#6A3DE8', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'applied', v: funnel[0]?.count ?? 0, cls: 'text-brand-600' },
                  { label: 'shortlisted', v: funnel[1]?.count ?? 0, cls: 'text-pink' },
                  { label: 'HR round', v: funnel[3]?.count ?? 0, cls: 'text-amber' },
                  { label: 'offers', v: totals.offers, cls: 'text-coral' },
                ].map((x) => (
                  <div key={x.label}>
                    <dt className="text-[11px] text-ink-mute">{x.label}</dt>
                    <dd className={`num text-2xl ${x.cls}`}>{x.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4"><Progress value={placementRate} label="placement rate" /></div>
            </div>
          )}
        </Card>

        {/* attendance by batch */}
        <Card className="lg:col-span-5">
          <CardHeader
            title="attendance by batch"
            subtitle="Share of marked days present · 75% target"
            action={
              <>
                <IconButton size="sm" label={sortDesc ? 'Original order' : 'Sort by attendance'} active={sortDesc} onClick={() => setSortDesc((v) => !v)}><ArrowUpDown className="h-3.5 w-3.5" /></IconButton>
                <IconButton size="sm" label={attTable ? 'Show chart' : 'Show table'} active={attTable} onClick={() => setAttTable((v) => !v)}><Table2 className="h-3.5 w-3.5" /></IconButton>
              </>
            }
          />
          {att.length === 0 ? <div className="p-5"><EmptyState title="No batches yet" /></div> : attTable ? (
            <table className="mx-5 my-4 w-[calc(100%-2.5rem)] text-left text-sm">
              <thead className="text-xs text-ink-mute"><tr><th className="py-2 font-normal">Batch</th><th className="font-normal">Students</th><th className="text-right font-normal">Present</th></tr></thead>
              <tbody className="divide-y divide-line">
                {att.map((d) => (
                  <tr key={d.name}><td className="py-2.5 font-medium">{d.name}</td><td className="tabular-nums text-ink-soft">{d.students}</td><td className={`text-right font-semibold tabular-nums ${d.pct < 75 ? 'text-coral' : 'text-brand-600'}`}>{d.pct}%</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-72 px-3 pb-4 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={att} margin={{ top: 34, right: 8, left: -18, bottom: 0 }}>
                  {gradientDefs('att')}
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => v.replace(/^\d{4}\s/, '')} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS} tickLine={false} axisLine={false} />
                  <ReferenceLine y={75} stroke="#EE5DA6" strokeDasharray="4 4" />
                  <Tooltip cursor={{ fill: 'rgba(127,86,245,0.06)' }} content={<ChartTooltip suffix="% present" />} />
                  <Bar dataKey="pct" radius={[10, 10, 10, 10]} maxBarSize={34}>
                    {att.map((d) => <Cell key={d.name} fill={d.pct >= 75 ? 'url(#att-bar)' : VIOLET_SOFT} />)}
                    <LabelList dataKey="pct" content={(p) => <ChipLabel {...(p as object)} highlight={best} suffix="%" />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* stage distribution */}
        <Card className="lg:col-span-12">
          <CardHeader title="where applications stand" subtitle="Current stage of every application" />
          <ul className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {stage_counts.map((s) => (
              <li key={s.stage}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{stageLabel(s.stage)}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EEEDF7]">
                  <div className={`h-full rounded-full ${s.stage === 'rejected' || s.stage === 'withdrawn' ? 'bg-coral' : 'bg-grad'}`} style={{ width: `${(s.count / maxStage) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
