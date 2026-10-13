import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Briefcase, GraduationCap, Layers, Send, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { stageLabel } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, StatCard } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

const BRAND = '#6D5DFB'
const BRAND_SOFT = '#B3A7FF'
const AXIS = { fontSize: 12, fill: '#8A8FA3' }

function ChartTooltip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-ink-soft">{payload[0]!.value}{suffix}</p>
    </div>
  )
}

export default function DeanAnalytics() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: api.analytics })

  if (q.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-80" />
      </div>
    )
  if (q.isError) return <ErrorState message={q.error.message} action={{ label: 'Retry', onClick: () => q.refetch() }} />

  const { totals, batch_attendance, funnel } = q.data
  const attendanceData = batch_attendance.map((b) => ({ name: b.batch_name, pct: Number(b.attendance_pct), marked: b.total_marked, students: b.student_count }))
  const funnelData = funnel.map((f) => ({ name: stageLabel(f.stage), count: f.count }))
  const placementRate = totals.students ? Math.round((totals.offers / totals.students) * 100) : 0

  return (
    <>
      <PageHeader eyebrow="Overview" title="Placement analytics" subtitle="Attendance and placement progress across all batches." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Batches" value={totals.batches} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Students" value={totals.students} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="Drives" value={totals.drives} icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Applications" value={totals.applications} icon={<Send className="h-4 w-4" />} />
        <StatCard label="Offers" value={<span className="text-accent-gradient">{totals.offers}</span>} hint={`${placementRate}% of students`} icon={<Trophy className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="pb-4">
          <CardHeader title="Attendance by batch" subtitle="Share of marked days present · 75% target" />
          {attendanceData.length === 0 ? (
            <div className="p-5"><EmptyState title="No batches yet" /></div>
          ) : (
            <>
              <div className="h-72 px-2 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 20, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#EEF0F5" />
                    <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
                    <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
                    <ReferenceLine y={75} stroke="#8A8FA3" strokeDasharray="4 4" />
                    <Tooltip cursor={{ fill: '#F3F1FF' }} content={<ChartTooltip suffix="%" />} />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {attendanceData.map((d) => <Cell key={d.name} fill={d.pct >= 75 ? BRAND : BRAND_SOFT} />)}
                      <LabelList dataKey="pct" position="top" formatter={(v: number) => `${Math.round(v)}%`} style={{ fontSize: 11, fill: '#4B5065', fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mx-5 mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-ink-mute">
                    <tr><th className="py-1.5 font-semibold">Batch</th><th className="font-semibold">Students</th><th className="font-semibold">Days marked</th><th className="text-right font-semibold">Present</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {attendanceData.map((d) => (
                      <tr key={d.name}><td className="py-1.5 font-medium">{d.name}</td><td>{d.students}</td><td>{d.marked}</td><td className={`text-right font-semibold ${d.pct >= 75 ? 'text-ink' : 'text-rose-600'}`}>{d.pct}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card className="pb-4">
          <CardHeader title="Placement funnel" subtitle="Applications at or beyond each stage" />
          {totals.applications === 0 ? (
            <div className="p-5"><EmptyState title="No applications yet" /></div>
          ) : (
            <div className="h-72 px-2 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#EEF0F5" />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={120} />
                  <Tooltip cursor={{ fill: '#F3F1FF' }} content={<ChartTooltip suffix=" applications" />} />
                  <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={28}>
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#4B5065', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
