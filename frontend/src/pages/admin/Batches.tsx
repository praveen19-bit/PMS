import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Batch } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'

type Form = { name: string; department: string; year: number }

export default function AdminBatches() {
  const qc = useQueryClient()
  const toast = useToast()
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: api.analytics })
  const [editing, setEditing] = useState<Batch | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>({ name: '', department: '', year: new Date().getFullYear() })
  const [toDelete, setToDelete] = useState<Batch | null>(null)

  const stats = new Map((analytics.data?.batch_attendance ?? []).map((b) => [b.batch_id, b]))

  const save = useMutation({
    mutationFn: () => {
      const body = { name: form.name.trim(), department: form.department.trim().toUpperCase(), year: Number(form.year) }
      return editing ? api.updateBatch(editing.id, body) : api.createBatch(body)
    },
    onSuccess: (b) => { toast(editing ? `Updated ${b.name}` : `Created ${b.name}`); qc.invalidateQueries({ queryKey: ['batches'] }); qc.invalidateQueries({ queryKey: ['analytics'] }); setOpen(false) },
    onError: (e) => toast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: (b: Batch) => api.deleteBatch(b.id),
    onSuccess: () => { toast('Batch deleted'); qc.invalidateQueries({ queryKey: ['batches'] }); setToDelete(null) },
    onError: (e) => toast(e.message, 'error'),
  })

  const startCreate = () => { setEditing(null); setForm({ name: '', department: '', year: new Date().getFullYear() }); setOpen(true) }
  const startEdit = (b: Batch) => { setEditing(b); setForm({ name: b.name, department: b.department, year: b.year }); setOpen(true) }
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate() }

  return (
    <>
      <PageHeader eyebrow="Administration" title="Batches" subtitle="Group fastrack students by cohort." action={<Button icon={<Plus className="h-4 w-4" />} onClick={startCreate}>New batch</Button>} />
      {batches.isPending ? <ListSkeleton rows={3} /> : batches.isError ? (
        <ErrorState message={batches.error.message} action={{ label: 'Retry', onClick: () => batches.refetch() }} />
      ) : batches.data.length === 0 ? (
        <EmptyState icon={<Layers className="h-6 w-6" />} title="No batches yet" message="Create a batch like “2026 CSE-A”, then add students to it from Users." action={<Button onClick={startCreate}>Create batch</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {batches.data.map((b) => {
            const s = stats.get(b.id)
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{b.name}</h3>
                    <p className="text-sm text-ink-mute">{b.department} · {b.year}</p>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(b)} aria-label={`Edit ${b.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(b)} aria-label={`Delete ${b.name}`}><Trash2 className="h-4 w-4 text-coral" /></Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl bg-[#F6F5FC] py-2"><p className="num text-lg text-brand-600">{s?.student_count ?? '–'}</p><p className="text-[11px] text-ink-mute">Students</p></div>
                  <div className="rounded-2xl bg-[#F6F5FC] py-2"><p className="num text-lg text-brand-600">{s ? `${Math.round(s.attendance_pct)}%` : '–'}</p><p className="text-[11px] text-ink-mute">Attendance</p></div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit batch' : 'New batch'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="batch-form" loading={save.isPending}>{editing ? 'Save' : 'Create'}</Button></>}>
        <form id="batch-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Name" htmlFor="bname"><input id="bname" required className="input" placeholder="2026 CSE-A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <Field label="Department" htmlFor="bdept"><input id="bdept" required className="input" placeholder="CSE" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="Graduation year" htmlFor="byear"><input id="byear" type="number" required min={2000} max={2100} className="input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Field>
        </form>
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete batch?" description={toDelete?.name}
        footer={<><Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button><Button variant="danger" loading={remove.isPending} onClick={() => toDelete && remove.mutate(toDelete)}>Delete</Button></>}>
        <p className="text-sm text-ink-soft">Students in this batch will be unassigned (not deleted), and faculty assignments to it are removed.</p>
      </Modal>
    </>
  )
}
