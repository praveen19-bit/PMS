import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Layers, MessagesSquare, Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { Application } from '@/lib/types'
import { fmtDate, isClosedStage, stageLabel, stageTone } from '@/lib/format'
import { useBatchSelection } from '@/hooks/useBatches'
import { useRole } from '@/hooks/useRole'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { ApplicationTimeline } from '@/components/ApplicationTimeline'

export default function FacultyInterviews() {
  const { batches, selected, setSelected } = useBatchSelection()
  const { is } = useRole()
  const [q, setQ] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)
  const [editing, setEditing] = useState<Application | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [stage, setStage] = useState('')
  const [remarks, setRemarks] = useState('')
  const qc = useQueryClient()
  const toast = useToast()

  const stages = useQuery({ queryKey: ['stages'], queryFn: api.stages, staleTime: Infinity })
  const apps = useQuery({ queryKey: ['applications', selected], queryFn: () => api.applications({ batch_id: selected }), enabled: Boolean(selected) })

  const log = useMutation({
    mutationFn: () => api.logStage(editing!.id, stage, remarks.trim() || undefined),
    onSuccess: (a) => {
      toast(`${a.student_name ?? 'Student'} → ${stageLabel(a.current_stage)}`)
      qc.invalidateQueries({ queryKey: ['applications'] })
      setEditing(null)
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const openEditor = (a: Application) => {
    const next = stages.data?.[Math.min((stages.data?.indexOf(a.current_stage) ?? 0) + 1, stages.data.length - 1)]
    setStage(next ?? a.current_stage)
    setRemarks('')
    setEditing(a)
  }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (apps.data ?? [])
      .filter((a) => !onlyActive || !isClosedStage(a.current_stage))
      .filter((a) => !needle || `${a.student_name} ${a.roll_no} ${a.drive?.company_name}`.toLowerCase().includes(needle))
  }, [apps.data, q, onlyActive])

  if (batches.isPending) return <ListSkeleton rows={4} />
  if (batches.isError) return <ErrorState message={batches.error.message} />
  if (!batches.data.length) return <EmptyState icon={<Layers className="h-6 w-6" />} title="No batches assigned" />

  const facultyLocked = (a: Application) => !is('dean', 'admin') && isClosedStage(a.current_stage)

  return (
    <>
      <PageHeader eyebrow="Interview progress" title="Interviews" subtitle="Log each round as your students progress." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={selected} onChange={setSelected} items={batches.data.map((b) => ({ value: b.id, label: b.name }))} />
        <div className="flex items-center gap-3">
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-ink-soft">
            <input type="checkbox" className="h-4 w-4 rounded accent-ink" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            Active only
          </label>
          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input className="input pl-10" placeholder="Student or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" />
          </div>
        </div>
      </div>

      {apps.isPending ? (
        <ListSkeleton rows={4} />
      ) : apps.isError ? (
        <ErrorState message={apps.error.message} action={{ label: 'Retry', onClick: () => apps.refetch() }} />
      ) : list.length === 0 ? (
        <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="No applications" message={onlyActive ? 'No active applications in this batch.' : 'Students in this batch have not applied to any drives yet.'} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {list.map((a) => (
              <li key={a.id}>
                <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded(expanded === a.id ? null : a.id)} aria-expanded={expanded === a.id}>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-ink-mute transition ${expanded === a.id ? 'rotate-180' : ''}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.student_name} <span className="font-normal text-ink-mute">· {a.roll_no}</span></p>
                      <p className="truncate text-xs text-ink-mute">{a.drive?.company_name} — {a.drive?.role_offered} · {fmtDate(a.drive?.drive_date)}</p>
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-3 pl-7 sm:pl-0">
                    <Badge tone={stageTone(a.current_stage)}>{stageLabel(a.current_stage)}</Badge>
                    <Button size="sm" variant="secondary" disabled={facultyLocked(a)} onClick={() => openEditor(a)}>Update</Button>
                  </div>
                </div>
                {expanded === a.id && (
                  <div className="border-t border-line bg-subtle/40 px-5 py-4 sm:pl-12"><ApplicationTimeline app={a} /></div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Log interview stage"
        description={editing ? `${editing.student_name} · ${editing.drive?.company_name}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={log.isPending} disabled={!stage || stage === editing?.current_stage} onClick={() => log.mutate()}>Save stage</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="New stage" htmlFor="stage">
            <select id="stage" className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
              {(stages.data ?? []).map((s) => (
                <option key={s} value={s} disabled={s === editing?.current_stage}>{stageLabel(s)}{s === editing?.current_stage ? ' (current)' : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Remarks (optional)" htmlFor="remarks">
            <textarea id="remarks" rows={3} maxLength={500} className="input resize-none" placeholder="e.g. Cleared technical round, HR on Friday" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>
          {stage && ['offered', 'rejected', 'withdrawn'].includes(stage) && (
            <p className="rounded-2xl bg-warning/15 p-3 text-xs text-warning">This closes the application. Only the dean can change it afterwards.</p>
          )}
        </div>
      </Modal>
    </>
  )
}
