import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Search, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react'
import { api } from '@/lib/api'
import type { Role, UserRow } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import type { Tone } from '@/lib/format'

const ROLES: Role[] = ['student', 'faculty', 'dean', 'admin']
const ROLE_TONE: Record<Role, Tone> = { student: 'neutral', faculty: 'brand', dean: 'warning', admin: 'danger' }

interface FormState {
  email: string; password: string; full_name: string; role: Role
  roll_no: string; department: string; batch_id: string; is_fastrack: boolean
}
const EMPTY: FormState = { email: '', password: '', full_name: '', role: 'student', roll_no: '', department: '', batch_id: '', is_fastrack: true }

export default function AdminUsers() {
  const { me } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.users() })
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const [filter, setFilter] = useState<Role | 'all'>('all')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [toDelete, setToDelete] = useState<UserRow | null>(null)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const batchName = useMemo(() => new Map((batches.data ?? []).map((b) => [b.id, b.name])), [batches.data])
  const list = (users.data ?? [])
    .filter((u) => filter === 'all' || u.role === filter)
    .filter((u) => `${u.full_name} ${u.student?.roll_no ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))

  const startCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const startEdit = (u: UserRow) => {
    setEditing(u)
    setForm({ ...EMPTY, full_name: u.full_name, role: u.role, roll_no: u.student?.roll_no ?? '', department: u.student?.department ?? '', batch_id: u.student?.batch_id ?? '', is_fastrack: u.student?.is_fastrack ?? true })
    setOpen(true)
  }

  const save = useMutation({
    mutationFn: () => {
      const student = form.role === 'student'
        ? { roll_no: form.roll_no.trim(), department: form.department.trim().toUpperCase(), batch_id: form.batch_id || null, is_fastrack: form.is_fastrack }
        : undefined
      return editing
        ? api.updateUser(editing.id, { full_name: form.full_name.trim(), role: form.role, student })
        : api.createUser({ email: form.email.trim(), password: form.password, full_name: form.full_name.trim(), role: form.role, student })
    },
    onSuccess: (u) => { toast(editing ? `Updated ${u.full_name}` : `Created ${u.full_name}`); qc.invalidateQueries({ queryKey: ['users'] }); setOpen(false) },
    onError: (e) => toast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: (u: UserRow) => api.deleteUser(u.id),
    onSuccess: () => { toast('User deleted'); qc.invalidateQueries({ queryKey: ['users'] }); setToDelete(null) },
    onError: (e) => toast(e.message, 'error'),
  })

  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate() }
  const counts = Object.fromEntries(ROLES.map((r) => [r, users.data?.filter((u) => u.role === r).length]))

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" subtitle="Create accounts and manage roles." action={<Button icon={<UserPlus className="h-4 w-4" />} onClick={startCreate}>Add user</Button>} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onChange={setFilter} items={[
          { value: 'all', label: 'All', count: users.data?.length },
          ...ROLES.map((r) => ({ value: r, label: r[0]!.toUpperCase() + r.slice(1), count: counts[r] })),
        ]} />
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-10" placeholder="Search name or roll no" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        </div>
      </div>

      {users.isPending ? <ListSkeleton rows={5} /> : users.isError ? (
        <ErrorState message={users.error.message} action={{ label: 'Retry', onClick: () => users.refetch() }} />
      ) : list.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="No users found" />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {list.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Avatar name={u.full_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.full_name}{u.id === me?.profile.id && <span className="ml-1 text-xs text-ink-mute">(you)</span>}</p>
                  <p className="truncate text-xs text-ink-mute">
                    {u.student ? `${u.student.roll_no} · ${u.student.department} · ${batchName.get(u.student.batch_id ?? '') ?? 'No batch'}` : u.role === 'student' ? 'Student details missing' : '—'}
                  </p>
                </div>
                <Badge tone={ROLE_TONE[u.role]} className="capitalize">{u.role}</Badge>
                <Button variant="ghost" size="sm" onClick={() => startEdit(u)} aria-label={`Edit ${u.full_name}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" disabled={u.id === me?.profile.id} onClick={() => setToDelete(u)} aria-label={`Delete ${u.full_name}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit user' : 'Add user'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="user-form" loading={save.isPending}>{editing ? 'Save' : 'Create user'}</Button></>}>
        <form id="user-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Full name" htmlFor="name"><input id="name" required className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field></div>
          {!editing && (
            <>
              <Field label="Email" htmlFor="email"><input id="email" type="email" required className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Temporary password" htmlFor="pw" hint="At least 8 characters"><input id="pw" type="text" minLength={8} required className="input" value={form.password} onChange={(e) => set('password', e.target.value)} /></Field>
            </>
          )}
          <div className="sm:col-span-2">
            <Field label="Role" htmlFor="role">
              <select id="role" className="input capitalize" value={form.role} disabled={editing?.id === me?.profile.id} onChange={(e) => set('role', e.target.value as Role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          {form.role === 'student' && (
            <>
              <Field label="Roll number" htmlFor="roll"><input id="roll" required className="input" value={form.roll_no} onChange={(e) => set('roll_no', e.target.value)} /></Field>
              <Field label="Department" htmlFor="dept"><input id="dept" required className="input" placeholder="CSE" value={form.department} onChange={(e) => set('department', e.target.value)} /></Field>
              <Field label="Batch" htmlFor="sbatch">
                <select id="sbatch" className="input" value={form.batch_id} onChange={(e) => set('batch_id', e.target.value)}>
                  <option value="">No batch</option>
                  {batches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium">
                <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={form.is_fastrack} onChange={(e) => set('is_fastrack', e.target.checked)} />
                Fastrack student
              </label>
            </>
          )}
        </form>
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete user?" description={toDelete?.full_name}
        footer={<><Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button><Button variant="danger" loading={remove.isPending} onClick={() => toDelete && remove.mutate(toDelete)}>Delete</Button></>}>
        <p className="text-sm text-ink-soft">This permanently removes the account and its attendance, applications and interview history.</p>
      </Modal>
    </>
  )
}
