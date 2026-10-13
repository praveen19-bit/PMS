import { Zap } from 'lucide-react'

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
        <Zap className="h-5 w-5" fill="currentColor" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight">
          Fastrack<span className="text-brand-500"> Tracker</span>
        </span>
      )}
    </span>
  )
}
