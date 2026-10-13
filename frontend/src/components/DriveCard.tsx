import type { ReactNode } from 'react'
import { Building2, CalendarDays, CheckCircle2, IndianRupee } from 'lucide-react'
import type { Drive } from '@/lib/types'
import { daysUntil, fmtDate } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Props {
  drive: Drive
  onApply?: (drive: Drive) => void
  applying?: boolean
  compact?: boolean
}

export function DriveCard({ drive, onApply, applying, compact }: Props) {
  const d = daysUntil(drive.drive_date)
  const past = d !== null && d < 0
  const when = d === null ? 'Date TBA' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d > 0 ? `In ${d} days` : 'Completed'

  let cta: ReactNode = null
  if (onApply) {
    if (drive.applied) cta = <Button variant="secondary" size="sm" disabled icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}>Applied</Button>
    else if (!drive.eligible) cta = <Button variant="secondary" size="sm" disabled>Not eligible</Button>
    else if (past) cta = <Button variant="secondary" size="sm" disabled>Closed</Button>
    else cta = <Button size="sm" loading={applying} onClick={() => onApply(drive)}>Apply now</Button>
  }

  return (
    <Card className="group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-extrabold text-brand-600">
          {drive.company_name.charAt(0).toUpperCase() || <Building2 className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-bold">{drive.company_name}</h3>
              <p className="truncate text-sm text-ink-soft">{drive.role_offered}</p>
            </div>
            <Badge tone={past ? 'neutral' : d !== null && d <= 3 ? 'warning' : 'brand'}>{when}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
            {drive.ctc && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <IndianRupee className="h-3.5 w-3.5" />{drive.ctc}
              </span>
            )}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(drive.drive_date)}</span>
            {drive.eligible_departments.length > 0 && <span>{drive.eligible_departments.join(' · ')}</span>}
          </div>

          {!compact && drive.eligibility_criteria && (
            <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{drive.eligibility_criteria}</p>
          )}

          {cta && <div className="mt-4 flex justify-end">{cta}</div>}
        </div>
      </div>
    </Card>
  )
}
