import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'

export default function DeanAssignments() {
  const qc = useQueryClient()
  const toast = useToast()
  const faculty = useQuery({ queryKey: ['users', 'faculty'], queryFn: () => api.users('faculty') })
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: api.assignments })
  const [facultyId, setFacultyId] = useState('')
  const [batchId, setBatchId] = useState('')

  const assign = useMutation({
    mutationFn: () => api.assign(facultyId, batchId),
    onSuccess: () => { toast('Faculty assigned'); qc.invalidateQueries({ queryKey: ['assignments'] }); setBatchId('') },
    onError: (e) => toast(e.message, 'error'),
  })
  const unassign = useMutation({
    mutationFn: (id: string) => api.unassign(id),
    onSuccess: () => { toast('Assignment removed'); qc.invalidateQueries({ queryKey: ['assignments'] }) },
    onError: (e) => toast(e.message, 'error'),
  })

  const taken = new Set((assignments.data ?? []).filter((a) => a.faculty_id === facultyId).map((a) => a.batch_id))
  const byBatch = new Map<string, typeof assignments.data>()
  for (const a of assignments.data ?? []) byBatch.set(a.batch_id, [...(byBatch.get(a.batch_id) ?? []), a])

  return (
    <>
      <PageHeader eyebrow="Faculty ↔ batches" title="Assignments" subtitle="Faculty only see students in the batches assigned to them." />

      <Card className="mb-6 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Faculty" htmlFor="fac">
            <select id="fac" className="input" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              <option value="">Select faculty…</option>
              {faculty.data?.map((f) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
            </select>
          </Field>
          <Field label="Batch" htmlFor="batch">
            <select id="batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)} disabled={!facultyId}>
              <option value="">Select batch…</option>
              {batches.data?.map((b) => <option key={b.id} value={b.id} disabled={taken.has(b.id)}>{b.name}{taken.has(b.id) ? ' (assigned)' : ''}</option>)}
            </select>
          </Field>
          <Button icon={<Plus className="h-4 w-4" />} disabled={!facultyId || !batchId} loading={assign.isPending} onClick={() => assign.mutate()}>Assign</Button>
        </div>
        {faculty.data?.length === 0 && <p className="mt-3 text-sm text-ink-mute">No faculty accounts yet — the admin can create them under Users.</p>}
      </Card>

      {batches.isPending || assignments.isPending ? <ListSkeleton rows={3} /> : batches.isError || assignments.isError ? (
        <ErrorState message={(batches.error ?? assignments.error)?.message} />
      ) : batches.data.length === 0 ? (
        <EmptyState icon={<Link2 className="h-6 w-6" />} title="No batches yet" message="Create batches first (Admin → Batches)." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.data.map((b) => {
            const list = byBatch.get(b.id) ?? []
            return (
              <Card key={b.id} className="pb-3">
                <CardHeader title={b.name} subtitle={`${b.department} · ${b.year}`} />
                {list.length === 0 ? (
                  <p className="px-6 pt-3 text-sm text-ink-mute">No faculty assigned yet</p>
                ) : (
                  <ul className="mt-2">
                    {list.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 px-6 py-2">
                        <Avatar name={a.faculty_name ?? '?'} ring className="h-10 w-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.faculty_name}</p>
                          <p className="text-xs text-ink-mute">since {fmtDate(a.assigned_at)}</p>
                        </div>
                        <button className="rounded-full p-1.5 text-ink-mute hover:bg-danger/15 hover:text-danger" aria-label={`Unassign ${a.faculty_name}`}
                          onClick={() => unassign.mutate(a.id)}>
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
