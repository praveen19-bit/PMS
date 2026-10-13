import { MessageSquareQuote } from 'lucide-react'
import type { StatusLogEntry } from '@/lib/types'
import { fmtDate, stageLabel } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { Stars } from '@/components/ui/Stars'

/** The kit's "user review" card, used for faculty feedback on an interview round. */
export function ReviewCard({ entry }: { entry: StatusLogEntry }) {
  const name = entry.updater_name || 'Placement cell'
  return (
    <article className="rounded-xl border border-line bg-subtle/50 p-4">
      <header className="flex items-center gap-3">
        <Avatar name={name} ring className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {entry.rating ? <Stars value={entry.rating} label="Round rating" /> : <p className="text-[11px] text-ink-mute">No rating</p>}
        </div>
        <time className="shrink-0 text-[11px] text-ink-mute" dateTime={entry.updated_at ?? undefined}>{fmtDate(entry.updated_at, { day: 'numeric', month: 'short' })}</time>
      </header>
      <h4 className="mt-3 text-sm font-semibold">{stageLabel(entry.stage)}</h4>
      {entry.remarks ? (
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{entry.remarks}</p>
      ) : (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-mute"><MessageSquareQuote className="h-3.5 w-3.5" />No written feedback for this round.</p>
      )}
    </article>
  )
}

/** Log entries worth showing as reviews (have a rating or remarks), newest first. */
export const reviewsOf = (history: StatusLogEntry[]) =>
  [...history].filter((h) => h.rating || h.remarks).sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
