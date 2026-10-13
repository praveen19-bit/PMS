import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { Drive } from '@/lib/types'
import { daysUntil } from '@/lib/format'
import { useApply } from '@/hooks/useApply'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { DriveCard } from '@/components/DriveCard'

type Filter = 'open' | 'applied' | 'all'

export default function StudentDrives() {
  const [filter, setFilter] = useState<Filter>('open')
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<Drive | null>(null)
  const drives = useQuery({ queryKey: ['drives', 'all'], queryFn: () => api.drives() })
  const apply = useApply()

  const isOpen = (d: Drive) => !d.applied && d.eligible && (daysUntil(d.drive_date) ?? 0) >= 0
  const list = useMemo(() => {
    const all = drives.data ?? []
    const needle = q.trim().toLowerCase()
    return all
      .filter((d) => (filter === 'open' ? isOpen(d) : filter === 'applied' ? d.applied : true))
      .filter((d) => !needle || `${d.company_name} ${d.role_offered}`.toLowerCase().includes(needle))
  }, [drives.data, filter, q])

  const counts = {
    open: drives.data?.filter(isOpen).length,
    applied: drives.data?.filter((d) => d.applied).length,
    all: drives.data?.length,
  }

  return (
    <>
      <PageHeader title="Company drives" subtitle="Browse upcoming drives and apply in one tap." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onChange={setFilter} items={[
          { value: 'open', label: 'Open', count: counts.open },
          { value: 'applied', label: 'Applied', count: counts.applied },
          { value: 'all', label: 'All', count: counts.all },
        ]} />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-10" placeholder="Search company or role" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search drives" />
        </div>
      </div>

      {drives.isPending ? (
        <ListSkeleton rows={4} />
      ) : drives.isError ? (
        <ErrorState message={drives.error.message} action={{ label: 'Retry', onClick: () => drives.refetch() }} />
      ) : list.length === 0 ? (
        <EmptyState title={filter === 'applied' ? 'No applications yet' : 'No drives found'} message={q ? 'Try a different search.' : 'Check back soon — new drives are posted regularly.'} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((d) => (
            <DriveCard key={d.id} drive={d} onApply={setConfirm} applying={apply.isPending && apply.variables?.id === d.id} />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={`Apply to ${confirm?.company_name ?? ''}?`}
        description={confirm?.role_offered}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button loading={apply.isPending} onClick={() => confirm && apply.mutate(confirm, { onSettled: () => setConfirm(null) })}>Confirm & apply</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Your profile will be shared with the placement cell for this drive. Make sure you meet the eligibility criteria:
        </p>
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-[#F6F5FC] p-3 text-sm">{confirm?.eligibility_criteria || 'No specific criteria listed.'}</p>
      </Modal>
    </>
  )
}
