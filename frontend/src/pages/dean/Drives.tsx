import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { api } from '@/lib/api'
import type { Drive, DriveInput } from '@/lib/types'
import { daysUntil, fmtDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'

const EMPTY: DriveInput = { company_name: '', role_offered: '', ctc: '', eligibility_criteria: '', eligible_departments: [], drive_date: '' }

export default function DeanDrives() {
  const qc = useQueryClient()
  const toast = useToast()
  const drives = useQuery({ queryKey: ['drives', 'staff'], queryFn: () => api.drives() })
  const [editing, setEditing] = useState<Drive | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DriveInput>(EMPTY)
  const [depts, setDepts] = useState('')
  const [toDelete, setToDelete] = useState<Drive | null>(null)

  const startCreate = () => { setEditing(null); setForm(EMPTY); setDepts(''); setOpen(true) }
  const startEdit = (d: Drive) => {
    setEditing(d)
    setForm({ company_name: d.company_name, role_offered: d.role_offered, ctc: d.ctc ?? '', eligibility_criteria: d.eligibility_criteria ?? '', eligible_departments: d.eligible_departments, drive_date: d.drive_date ?? '' })
    setDepts(d.eligible_departments.join(', '))
    setOpen(true)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: DriveInput = {
        ...form,
        company_name: form.company_name.trim(),
        role_offered: form.role_offered.trim(),
        ctc: form.ctc?.trim() || null,
        eligibility_criteria: form.eligibility_criteria?.trim() || null,
        drive_date: form.drive_date || null,
        eligible_departments: depts.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      }
      return editing ? api.updateDrive(editing.id, payload) : api.createDrive(payload)
    },
    onSuccess: (d) => {
      toast(editing ? `Updated ${d.company_name}` : `Posted ${d.company_name}`)
      qc.invalidateQueries({ queryKey: ['drives'] })
      setOpen(false)
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: (d: Drive) => api.deleteDrive(d.id),
    onSuccess: () => { toast('Drive deleted'); qc.invalidateQueries({ queryKey: ['drives'] }); setToDelete(null) },
    onError: (e) => toast(e.message, 'error'),
  })

  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate() }
  const set = <K extends keyof DriveInput>(k: K, v: DriveInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <PageHeader eyebrow="Company drives" title="Drives" subtitle="Post and manage campus drives." action={<Button icon={<Plus className="h-4 w-4" />} onClick={startCreate}>New drive</Button>} />

      {drives.isPending ? <ListSkeleton rows={4} /> : drives.isError ? (
        <ErrorState message={drives.error.message} action={{ label: 'Retry', onClick: () => drives.refetch() }} />
      ) : drives.data.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No drives yet" message="Post your first company drive — students will see it instantly." action={<Button onClick={startCreate}>Post a drive</Button>} />
      ) : (
        <Card className="overflow-hidden">
          {/* Table on desktop, stacked rows on mobile */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-ink-mute">
                <tr><th className="px-5 py-3 font-semibold">Company</th><th className="font-semibold">CTC</th><th className="font-semibold">Date</th><th className="font-semibold">Departments</th><th className="font-semibold">Applicants</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {drives.data.map((d) => {
                  const past = (daysUntil(d.drive_date) ?? 0) < 0
                  return (
                    <tr key={d.id} className="hover:bg-canvas/60">
                      <td className="px-5 py-3"><p className="font-semibold">{d.company_name}</p><p className="text-xs text-ink-mute">{d.role_offered}</p></td>
                      <td className="font-medium text-emerald-600">{d.ctc || '—'}</td>
                      <td><span className="flex items-center gap-2">{fmtDate(d.drive_date)}{past && <Badge>Past</Badge>}</span></td>
                      <td className="text-xs text-ink-soft">{d.eligible_departments.join(', ') || 'All'}</td>
                      <td><span className="inline-flex items-center gap-1 font-semibold"><Users className="h-3.5 w-3.5 text-ink-mute" />{d.application_count ?? 0}</span></td>
                      <td className="pr-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(d)} aria-label={`Edit ${d.company_name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(d)} aria-label={`Delete ${d.company_name}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line md:hidden">
            {drives.data.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.company_name}</p>
                  <p className="truncate text-xs text-ink-mute">{d.role_offered} · {fmtDate(d.drive_date)} · {d.application_count ?? 0} applied</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => startEdit(d)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(d)} aria-label="Delete"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit drive' : 'New drive'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="drive-form" loading={save.isPending}>{editing ? 'Save changes' : 'Post drive'}</Button></>}>
        <form id="drive-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="company"><input id="company" required className="input" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></Field>
          <Field label="Role offered" htmlFor="role"><input id="role" required className="input" value={form.role_offered} onChange={(e) => set('role_offered', e.target.value)} /></Field>
          <Field label="CTC" htmlFor="ctc"><input id="ctc" className="input" placeholder="e.g. 8 LPA" value={form.ctc ?? ''} onChange={(e) => set('ctc', e.target.value)} /></Field>
          <Field label="Drive date" htmlFor="date"><input id="date" type="date" className="input" value={form.drive_date ?? ''} onChange={(e) => set('drive_date', e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Eligible departments" htmlFor="depts" hint="Comma-separated, e.g. CSE, IT. Leave blank for all departments.">
              <input id="depts" className="input" value={depts} onChange={(e) => setDepts(e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Eligibility criteria" htmlFor="criteria">
              <textarea id="criteria" rows={4} className="input resize-none" placeholder="e.g. CGPA ≥ 7.0, no active backlogs" value={form.eligibility_criteria ?? ''} onChange={(e) => set('eligibility_criteria', e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete drive?"
        description={toDelete ? `${toDelete.company_name} — ${toDelete.role_offered}` : undefined}
        footer={<><Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button><Button variant="danger" loading={remove.isPending} onClick={() => toDelete && remove.mutate(toDelete)}>Delete</Button></>}>
        <p className="text-sm text-ink-soft">This also removes all {toDelete?.application_count ?? 0} applications and their interview history. This can't be undone.</p>
      </Modal>
    </>
  )
}
