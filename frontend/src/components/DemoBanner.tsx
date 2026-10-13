import { resetDemoData } from '@/lib/demo/store'

/** Restore the sample data (demo mode) after confirmation. */
export function resetDemo() {
  if (!window.confirm('Reset all demo data to the original sample data?')) return
  resetDemoData()
  window.location.reload()
}
