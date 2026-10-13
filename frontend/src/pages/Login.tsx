import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { FullPageSpinner } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/hooks/useRole'
import { DEMO_MODE } from '@/lib/config'
import { DemoRolePicker } from '@/components/DemoRolePicker'
import { resetDemo } from '@/components/DemoBanner'

export default function Login() {
  const { session, initializing, me, meLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (initializing || (session && meLoading)) return <FullPageSpinner />
  if (session && me) return <Navigate to={HOME_BY_ROLE[me.profile.role]} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden lg:grid-cols-2">
      <div className="blob -left-32 -top-32 h-96 w-96 bg-brand-300/50" />
      <div className="blob -bottom-24 right-0 h-80 w-80 bg-teal-200/50 lg:right-1/2" />

      {/* Brand panel (desktop) */}
      <section className="relative hidden flex-col justify-between bg-brand-gradient p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Placement Cell</span></div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Every drive, every round, every student — on one track.</h2>
          <p className="mt-4 text-white/80">Attendance, company drives and interview progress for your fastrack batches, in real time.</p>
        </div>
        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} Fastrack Tracker</p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight">
            Welcome <span className="text-accent-gradient">back</span>
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            {DEMO_MODE ? 'Pick a role to explore the app with sample data.' : 'Sign in with the account issued by your placement cell.'}
          </p>

          {DEMO_MODE && (
            <div className="mt-8"><DemoRolePicker /></div>
          )}

          <form onSubmit={onSubmit} className={DEMO_MODE ? 'mt-6 space-y-4 border-t border-line pt-6' : 'mt-8 space-y-4'}>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <input id="email" type="email" autoComplete="email" required className="input pl-10" placeholder="you@college.edu"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <input id="password" type="password" autoComplete="current-password" required className="input pl-10" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
            <Button type="submit" size="lg" block loading={busy}>Sign in</Button>
          </form>

          {DEMO_MODE ? (
            <button onClick={resetDemo} className="mt-6 text-xs font-semibold text-ink-mute hover:text-brand-600">Reset demo data</button>
          ) : (
            <p className="mt-8 flex items-center gap-2 text-xs text-ink-mute">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Accounts are created by the placement cell admin.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
