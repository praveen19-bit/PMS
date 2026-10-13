import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowUpRight, ArrowUpDown, Briefcase, Layers, Plus, Table2 } from 'lucide-react'
import { api } from '@/lib/api'
import { stageLabel } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SphereArt } from '@/components/ui/SphereArt'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { AXIS, ChartTooltip, ChipLabel, GRID, hatchDefs, INK, LIME } from '@/components/charts'

const SHORT: Record<string, string> = {
  applied: 'Applied', shortlisted: 'Shortlist', aptitude_cleared: 'Aptitude', round1_completed: 'R1',
  round2_completed: 'R2', hr_round: 'HR', offered: 'Offer',
}

export default function DeanAnalytics() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: api.analytics })
  const [attTable, setAttTable] = useState(false)
  const [sortDesc, setSortDesc] = useState(false)

  if (q.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-[420px] rounded-4xl lg:col-span-4" />
          <Skeleton className="h-[420px] rounded-4xl lg:col-span-8" />
        </div>
      </div>
    )
  if (q.isError) return <ErrorState message={q.error.message} action={{ label: 'Retry', onClick: () => q.refetch() }} />

  const { totals, batch_attendance, funnel, stage_counts } = q.data
  let att = batch_attendance.map((b) => ({ name: b.batch_name, pct: Number(b.attendance_pct), marked: b.total_marked, students: b.student_count }))
  if (sortDesc) att = [...att].sort((a, b) => b.pct - a.pct)
  const best = att.reduce((bi, b, i, arr) => (b.pct > arr[bi]!.pct ? i : bi), 0)
  const avgAtt = att.length ? Math.round(att.reduce((s, b) => s + b.pct, 0) / att.length) : 0
  const funnelData = funnel.map((f) => ({ name: stageLabel(f.stage), count: f.count }))
  const pipeline = stage_counts
    .filter((s) => !['rejected', 'withdrawn'].includes(s.stage))
    .map((s) => ({ name: stageLabel(s.stage), short: SHORT[s.stage] ?? s.stage, count: s.count }))
  const peak = pipeline.reduce((bi, p, i, arr) => (p.count > arr[bi]!.count ? i : bi), 0)
  const placementRate = totals.students ? Math.round((totals.offers / totals.students) * 100) : 0
  const conversion = totals.applications ? Math.round((totals.offers / totals.applications) * 100) : 0
  const rejected = stage_counts.find((s) => s.stage === 'rejected')?.count ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Placement Performance"
        subtitle="Attendance and placement progress across all batches."
        action={
          <>
            <Link to="/dean/drives"><Button variant="secondary" icon={<Plus className="h-4 w-4" />}>Post a drive</Button></Link>
            <Link to="/dean/assignments"><Button icon={<ArrowUpRight className="h-4 w-4" />}>Assign faculty</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* Hero ----------------------------------------------------------- */}
        <Card className="relative overflow-hidden lg:col-span-4 lg:row-span-2">
          <SphereArt className="pointer-events-none absolute -right-8 -top-6 h-72 w-[120%]" seed={3} />
          <div className="relative flex h-full min-h-[460px] flex-col p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium">Placement season</span>
              <Badge tone="success">{placementRate}% placed</Badge>
            </div>
            <div className="glass-strong mt-auto rounded-4xl p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-lime"><Briefcase className="h-3.5 w-3.5" /></span>
                <div>
                  <p className="text-sm font-medium">Offers secured</p>
                  <p className="text-[11px] text-ink-mute">across {totals.drives} drives</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="num text-4xl">{totals.offers}</p>
                  <p className="text-[11px] text-ink-mute">offers</p>
                </div>
                <div>
                  <p className="num text-4xl">{conversion}<span className="text-xl text-ink-mute">%</span></p>
                  <p className="text-[11px] text-ink-mute">application → offer</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 items-end gap-2">
                {[
                  { label: 'Applications', v: totals.applications, cls: 'bg-white/70 bg-hatch ring-1 ring-ink/10' },
                  { label: 'Not selected', v: rejected, cls: 'bg-white/70 bg-hatch ring-1 ring-ink/10' },
                  { label: 'Offers', v: totals.offers, cls: 'bg-lime' },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex h-24 items-end">
                      <div className={`w-full rounded-[18px] ${b.cls}`} style={{ height: `${Math.max(34, (b.v / Math.max(1, totals.applications)) * 100)}%` }}>
                        <p className="num pt-1 text-center text-base">{b.v}</p>
                      </div>
                    </div>
                    <p className="mt-1.5 truncate text-center text-[10px] text-ink-mute">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance by batch ------------------------------------------ */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Attendance"
            subtitle="By batch · 75% target"
            action={
              <>
                <IconButton size="sm" label={sortDesc ? 'Original order' : 'Sort by attendance'} active={sortDesc} onClick={() => setSortDesc((v) => !v)}><ArrowUpDown className="h-3.5 w-3.5" /></IconButton>
                <IconButton size="sm" label={attTable ? 'Show chart' : 'Show table'} active={attTable} onClick={() => setAttTable((v) => !v)}><Table2 className="h-3.5 w-3.5" /></IconButton>
              </>
            }
          />
          <div className="px-5 pt-2">
            <p className="text-[11px] text-ink-mute">Average</p>
            <p className="num text-4xl">{avgAtt}<span className="text-xl text-ink-mute">%</span></p>
          </div>
          {att.length === 0 ? <div className="p-5"><EmptyState title="No batches yet" /></div> : attTable ? (
            <table className="mx-5 my-4 w-[calc(100%-2.5rem)] text-left text-xs">
              <thead className="text-ink-mute"><tr><th className="py-1.5 font-normal">Batch</th><th className="font-normal">Students</th><th className="text-right font-normal">Present</th></tr></thead>
              <tbody className="divide-y divide-line">
                {att.map((d) => (
                  <tr key={d.name}><td className="py-2 font-medium">{d.name}</td><td className="tabular-nums">{d.students}</td><td className={`text-right font-medium tabular-nums ${d.pct < 75 ? 'text-rose-600' : ''}`}>{d.pct}%</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-52 px-3 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={att} margin={{ top: 30, right: 4, left: 4, bottom: 0 }}>
                  {hatchDefs('att-hatch')}
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => v.replace(/^\d{4}\s/, '')} />
                  <YAxis hide domain={[0, 100]} />
                  <ReferenceLine y={75} stroke="rgba(17,18,20,0.35)" strokeDasharray="3 4" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.4)' }} content={<ChartTooltip suffix="% present" />} />
                  <Bar dataKey="pct" radius={[14, 14, 14, 14]} maxBarSize={46}>
                    {att.map((d, i) => <Cell key={d.name} fill={i === best ? LIME : 'url(#att-hatch)'} stroke="rgba(17,18,20,0.08)" />)}
                    <LabelList dataKey="pct" content={(p) => <ChipLabel {...(p as object)} highlight={best} suffix="%" />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Funnel -------------------------------------------------------- */}
        <Card className="lg:col-span-5">
          <CardHeader title="Placement funnel" subtitle="Applications at or beyond each stage" action={<Link to="/dean/drives"><IconButton size="sm" label="Open drives"><ArrowUpRight className="h-3.5 w-3.5" /></IconButton></Link>} />
          <div className="px-5 pt-2">
            <p className="text-[11px] text-ink-mute">Total applications</p>
            <p className="num text-4xl">{totals.applications.toLocaleString()}</p>
          </div>
          {totals.applications === 0 ? <div className="p-5"><EmptyState title="No applications yet" /></div> : (
            <div className="h-52 px-3 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 36, left: 0, bottom: 0 }}>
                  {hatchDefs('fun-hatch')}
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={104} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.4)' }} content={<ChartTooltip suffix=" applications" />} />
                  <Bar dataKey="count" radius={[12, 12, 12, 12]} maxBarSize={22}>
                    {funnelData.map((d, i) => <Cell key={d.name} fill={i === funnelData.length - 1 ? LIME : 'url(#fun-hatch)'} stroke="rgba(17,18,20,0.08)" />)}
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#55585F', fontWeight: 500 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Pipeline line ------------------------------------------------- */}
        <Card className="lg:col-span-5">
          <CardHeader title="Where applications stand" subtitle="Current stage of every open or offered application" />
          <div className="px-5 pt-2">
            <p className="text-[11px] text-ink-mute">Most at</p>
            <p className="num text-3xl">{pipeline[peak]?.name ?? '—'}</p>
          </div>
          <div className="h-48 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipeline} margin={{ top: 30, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipe-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INK} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={INK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="short" tick={AXIS} tickLine={false} axisLine={false} interval={0} padding={{ left: 14, right: 14 }} />
                <Tooltip cursor={{ stroke: 'rgba(17,18,20,0.2)' }} content={<ChartTooltip suffix=" applications" />} />
                <Area type="monotone" dataKey="count" stroke={INK} strokeWidth={2} fill="url(#pipe-fill)"
                  dot={{ r: 4, fill: INK, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: LIME, stroke: INK, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Totals -------------------------------------------------------- */}
        <Card className="flex flex-col lg:col-span-3">
          <CardHeader title="Cohort" action={<Link to="/dean/assignments"><IconButton size="sm" label="Assignments"><ArrowUpRight className="h-3.5 w-3.5" /></IconButton></Link>} />
          <div className="px-5 pt-2">
            <p className="text-[11px] text-ink-mute">Fastrack students</p>
            <p className="num text-4xl">{totals.students}</p>
          </div>
          <ul className="mt-auto space-y-1.5 p-3">
            {[
              { label: 'Batches', v: totals.batches, icon: Layers },
              { label: 'Drives', v: totals.drives, icon: Briefcase },
            ].map(({ label, v, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 rounded-3xl bg-white/55 px-3 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink"><Icon className="h-3.5 w-3.5" /></span>
                <span className="flex-1 text-sm text-ink-soft">{label}</span>
                <span className="num text-lg">{v}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 rounded-3xl bg-lime px-3 py-2.5 text-lime-ink">
              <span className="flex-1 text-sm">Placement rate</span>
              <span className="num text-lg">{placementRate}%</span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  )
}
