import { FlaskConical, RotateCcw } from 'lucide-react'
import { DEMO_MODE } from '@/lib/config'
import { resetDemoData } from '@/lib/demo/store'
import { useAuth } from '@/hooks/useAuth'

export function resetDemo() {
  if (!window.confirm('Reset all demo data to the original sample data?')) return
  resetDemoData()
  window.location.reload()
}

/** Slim strip shown on every page in demo mode. */
export function DemoBanner() {
  const { session, signOut } = useAuth()
  if (!DEMO_MODE) return null
  return (
    <div className="relative z-40 flex items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-1.5 text-center text-xs text-white/90">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <FlaskConical className="h-3.5 w-3.5 text-teal-300" /> Demo mode
      </span>
      <span className="hidden text-white/60 sm:inline">Sample data, saved only in this browser.</span>
      {session && (
        <button onClick={signOut} className="font-semibold text-teal-300 hover:underline">Switch role</button>
      )}
      <button onClick={resetDemo} className="inline-flex items-center gap-1 font-semibold text-white/70 hover:text-white" aria-label="Reset demo data">
        <RotateCcw className="h-3 w-3" /> Reset
      </button>
    </div>
  )
}
