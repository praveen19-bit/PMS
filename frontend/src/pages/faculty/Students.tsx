import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useBatchSelection } from '@/hooks/useBatches'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { stageLabel, stageTone } from '@/lib/format'

export default function FacultyStudents() {
  const { batches, selected, setSelected } = useBatchSelection()
  const [q, setQ] = useState('')
  const students = useQuery({ queryKey: ['batch-students', selected], queryFn: () => api.batchStudents(selected), enabled: Boolean(selected) })
  const apps = useQuery({ queryKey: ['applications', selected], queryFn: () => api.applications({ batch_id: selected }), enabled: Boolean(selected) })

  const byStudent = useMemo(() => {
    const m = new Map<string, { total: number; best?: string }>()
    for (const a of apps.data ?? []) {
      const cur = m.get(a.student_id) ?? { total: 0 }
      cur.total += 1
      if (a.current_stage === 'offered') cur.best = 'offered'
      m.set(a.student_id, cur)
    }
    return m
  }, [apps.data])

  const list = (students.data ?? []).filter((s) => `${s.full_name} ${s.roll_no}`.toLowerCase().includes(q.trim().toLowerCase()))

  if (batches.isPending) return <ListSkeleton rows={4} />
  if (batches.isError) return <ErrorState message={batches.error.message} />
  if (!batches.data.length) return <EmptyState icon={<Layers className="h-6 w-6" />} title="No batches assigned" />

  return (
    <>
      <PageHeader eyebrow="My batches" title="Students" subtitle={`${students.data?.length ?? 0} students`} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={selected} onChange={setSelected} items={batches.data.map((b) => ({ value: b.id, label: b.name }))} />
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-10" placeholder="Search name or roll no" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        </div>
      </div>
      {students.isPending ? (
        <ListSkeleton rows={4} />
      ) : students.isError ? (
        <ErrorState message={students.error.message} />
      ) : list.length === 0 ? (
        <EmptyState title="No students found" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => {
            const info = byStudent.get(s.user_id)
            return (
              <Card key={s.user_id} className="flex items-center gap-3 p-4">
                <Avatar name={s.full_name} ring status={info?.best === 'offered' ? 'placed' : undefined} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.full_name}</p>
                  <p className="text-xs text-ink-mute">{s.roll_no} · {s.department}</p>
                </div>
                <div className="text-right">
                  {info?.best ? <Badge tone={stageTone(info.best)}>{stageLabel(info.best)}</Badge> : <Badge>{info?.total ?? 0} applied</Badge>}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
