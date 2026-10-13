import type { ReactNode } from 'react'
import { CalendarDays, Check, ChevronRight } from 'lucide-react'
import type { Drive } from '@/lib/types'
import { daysUntil, fmtDate } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

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
    if (drive.applied) cta = <Button variant="soft" size="sm" disabled icon={<Check className="h-3.5 w-3.5" />}>Applied</Button>
    else if (!drive.eligible) cta = <Button variant="soft" size="sm" disabled>Not eligible</Button>
    else if (past) cta = <Button variant="soft" size="sm" disabled>Closed</Button>
    else cta = <Button size="sm" loading={applying} onClick={() => onApply(drive)}>Apply</Button>
  }

  return (
    <Card className="flex flex-col p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <Avatar name={drive.company_name} ring className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{drive.company_name}</h3>
          <p className="truncate text-xs text-ink-mute">{drive.role_offered}</p>
        </div>
        <Badge tone={past ? 'neutral' : d !== null && d <= 3 ? 'warning' : 'brand'}>{when}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-ink-mute">Package</p>
          <p className="num truncate text-xl text-brand-600">{drive.ctc || '—'}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-mute"><CalendarDays className="h-3.5 w-3.5 text-brand-500" />{fmtDate(drive.drive_date)}</span>
      </div>

      {!compact && drive.eligibility_criteria && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-soft">{drive.eligibility_criteria}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
        <div className="flex min-w-0 flex-wrap gap-1">
          {drive.eligible_departments.length
            ? drive.eligible_departments.map((x) => <Badge key={x}>{x}</Badge>)
            : <Badge>All departments</Badge>}
        </div>
        {cta ?? <ChevronRight className="h-4 w-4 text-brand-400" />}
      </div>
    </Card>
  )
}
