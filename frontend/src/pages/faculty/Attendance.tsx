import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Layers, RotateCcw, Save } from 'lucide-react'
import { api } from '@/lib/api'
import type { AttendanceStatus } from '@/lib/types'
import { fmtDate, todayISO } from '@/lib/format'
import { useBatchSelection } from '@/hooks/useBatches'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { AttendanceGrid } from '@/components/AttendanceGrid'
import { WeekStrip } from '@/components/WeekStrip'

export default function FacultyAttendance() {
  const { batches, selected, setSelected } = useBatchSelection()
  const [date, setDate] = useState(todayISO())
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | undefined>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const qc = useQueryClient()
  const toast = useToast()

  const roster = useQuery({
    queryKey: ['roster', selected, date],
    queryFn: () => api.roster(selected, date),
    enabled: Boolean(selected),
  })

  const resetToSaved = useCallback(() => {
    if (!roster.data) return
    setMarks(Object.fromEntries(roster.data.entries.map((e) => [e.student_id, e.status ?? undefined])))
    setDirty(new Set())
  }, [roster.data])

  // Reset local edits whenever the server roster (batch/date) changes.
  useEffect(resetToSaved, [resetToSaved])

  const save = useMutation({
    mutationFn: () =>
      api.saveAttendance(
        selected,
        date,
        [...dirty].filter((id) => marks[id]).map((id) => ({ student_id: id, status: marks[id]! })),
      ),
    onSuccess: (r) => {
      toast(`Saved attendance for ${r.saved} student${r.saved === 1 ? '' : 's'}`)
      qc.invalidateQueries({ queryKey: ['roster', selected, date] })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const set = (id: string, s: AttendanceStatus) => {
    setMarks((m) => ({ ...m, [id]: s }))
    setDirty((d) => new Set(d).add(id))
  }
  const markAllPresent = () => {
    const entries = roster.data?.entries ?? []
    setMarks((m) => Object.fromEntries(entries.map((e) => [e.student_id, m[e.student_id] ?? 'present'])))
    setDirty((d) => {
      const n = new Set(d)
      entries.forEach((e) => !marks[e.student_id] && n.add(e.student_id))
      return n
    })
  }

  const tally = useMemo(() => {
    const vals = Object.values(marks)
    return {
      present: vals.filter((v) => v === 'present').length,
      absent: vals.filter((v) => v === 'absent').length,
      leave: vals.filter((v) => v === 'leave').length,
      unmarked: vals.filter((v) => !v).length,
    }
  }, [marks])

  if (batches.isPending) return <ListSkeleton rows={4} />
  if (batches.isError) return <ErrorState message={batches.error.message} />
  if (!batches.data.length)
    return <EmptyState icon={<Layers className="h-6 w-6" />} title="No batches assigned" message="Ask the dean to assign you to a batch to start marking attendance." />

  return (
    <>
      <PageHeader eyebrow="Daily attendance" title="Mark attendance" subtitle={fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={selected} onChange={(v) => setSelected(v)} items={batches.data.map((b) => ({ value: b.id, label: b.name }))} />
      </div>

      <Card className="mb-4 p-4">
        <WeekStrip value={date} onChange={setDate} max={todayISO()} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5"><span className="bg-grad h-2.5 w-2.5 rounded-full" />{tally.present} present</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-coral" />{tally.absent} absent</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber" />{tally.leave} leave</span>
            {tally.unmarked > 0 && <span className="text-ink-mute">{tally.unmarked} unmarked</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} disabled={!dirty.size} onClick={resetToSaved}>Reset</Button>
            <Button variant="secondary" size="sm" icon={<CheckCheck className="h-3.5 w-3.5" />} disabled={!tally.unmarked} onClick={markAllPresent}>Mark rest present</Button>
          </div>
        </div>

        {roster.isPending ? (
          <div className="p-5"><ListSkeleton rows={4} /></div>
        ) : roster.isError ? (
          <div className="p-5"><ErrorState message={roster.error.message} action={{ label: 'Retry', onClick: () => roster.refetch() }} /></div>
        ) : roster.data.entries.length === 0 ? (
          <div className="p-5"><EmptyState title="No students in this batch" message="Students will appear here once the admin adds them to the batch." /></div>
        ) : (
          <AttendanceGrid entries={roster.data.entries} value={marks} onChange={set} dirty={dirty} />
        )}
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-24 z-20 mt-4 flex justify-end lg:bottom-6">
        <Button size="lg" icon={<Save className="h-4 w-4" />} disabled={!dirty.size} loading={save.isPending} onClick={() => save.mutate()}>
          Save {dirty.size > 0 && `(${dirty.size})`}
        </Button>
      </div>
    </>
  )
}
