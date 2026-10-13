import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import { api } from '@/lib/api'
import { fmtDate, stageLabel, stageTone } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/States'
import { ApplicationTimeline } from '@/components/ApplicationTimeline'
import { ReviewCard, reviewsOf } from '@/components/ReviewCard'
import { Link } from 'react-router-dom'

export default function StudentApplications() {
  const apps = useQuery({ queryKey: ['my-applications'], queryFn: api.myApplications })
  const { hash } = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (hash && apps.data) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, apps.data])

  return (
    <>
      <PageHeader title="My applications" subtitle="Track every round, from application to offer." />
      {apps.isPending ? (
        <ListSkeleton rows={3} />
      ) : apps.isError ? (
        <ErrorState message={apps.error.message} action={{ label: 'Retry', onClick: () => apps.refetch() }} />
      ) : apps.data.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No applications yet"
          message="When you apply to a drive, its interview progress shows up here."
          action={<Link to="/student/drives"><Button>Browse drives</Button></Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {apps.data.map((a) => (
            <Card key={a.id} id={a.id} className="scroll-mt-24 p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{a.drive?.company_name ?? 'Drive'}</h3>
                  <p className="truncate text-sm text-ink-soft">{a.drive?.role_offered}</p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {a.drive?.ctc && <span className="font-medium text-brand-700">{a.drive.ctc} · </span>}
                    Drive {fmtDate(a.drive?.drive_date)}
                  </p>
                </div>
                <Badge tone={stageTone(a.current_stage)}>{stageLabel(a.current_stage)}</Badge>
              </div>
              <ApplicationTimeline app={a} showRemarks={false} />
              {(() => {
                const reviews = reviewsOf(a.history)
                if (!reviews.length) return null
                const shown = expanded[a.id] ? reviews : reviews.slice(0, 1)
                return (
                  <section className="mt-6 border-t border-line pt-4" aria-label="Faculty feedback">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Faculty feedback</h4>
                      {reviews.length > 1 && (
                        <button className="text-xs font-medium text-brand-600" onClick={() => setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))}>
                          {expanded[a.id] ? 'Show latest only' : `Show all ${reviews.length}`}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">{shown.map((r) => <ReviewCard key={r.id} entry={r} />)}</div>
                  </section>
                )
              })()}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
