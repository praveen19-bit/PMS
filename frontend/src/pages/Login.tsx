import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowUpRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { SphereArt } from '@/components/ui/SphereArt'
import { ValueChip } from '@/components/ui/Card'
import { FullPageSpinner } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/hooks/useRole'
import { DEMO_MODE } from '@/lib/config'
import { supabaseUrl } from '@/lib/supabaseClient'
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
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      // A network failure here means the Supabase URL is wrong or unreachable.
      setError(/failed to fetch|networkerror|load failed/i.test(msg)
        ? `Can't reach Supabase at ${supabaseUrl || '(not set)'}. Check VITE_SUPABASE_URL in frontend/.env, or set VITE_DEMO_MODE=true to try the demo.`
        : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-[1480px] gap-4 p-3 sm:p-5 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:p-6">
      {/* Showcase panel */}
      <section className="glass sheen relative hidden flex-col overflow-hidden rounded-5xl p-10 lg:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-soft">Placement Cell</span>
        </div>
        <SphereArt className="pointer-events-none absolute -right-10 top-10 h-[46%] w-[95%]" />
        <div className="relative mt-auto max-w-lg">
          <h2 className="font-display text-[52px] font-light leading-[1.02] tracking-[-0.04em]">
            Every drive, every round, <span className="font-normal">on one track.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
            Attendance, company drives and interview progress for your fastrack batches — in one calm, real-time view.
          </p>
          <div className="glass-strong mt-8 grid grid-cols-3 gap-3 rounded-4xl p-4">
            {[['Batches', 'Live'], ['Rounds', 'Tracked'], ['Offers', 'Celebrated']].map(([k, v], i) => (
              <div key={k}>
                <p className="text-[11px] text-ink-mute">{k}</p>
                <p className="num mt-1 text-xl">{v}</p>
                {i === 2 && <ValueChip className="mt-1">new</ValueChip>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-col">
        <div className="glass sheen relative flex flex-1 flex-col overflow-hidden rounded-5xl px-5 py-8 sm:px-10 sm:py-12">
          <SphereArt seed={11} className="pointer-events-none absolute -right-16 -top-10 h-44 w-72 opacity-90 lg:hidden" />
          <div className="relative lg:hidden"><Logo /></div>

          <div className="relative mx-auto my-auto w-full max-w-md pt-24 lg:pt-0">
            <h1 className="font-display text-[40px] font-light leading-none tracking-[-0.04em] sm:text-5xl">Welcome back</h1>
            <p className="mt-3 text-sm text-ink-mute">
              {DEMO_MODE ? 'Pick a role to explore the app with sample data.' : 'Sign in with the account issued by your placement cell.'}
            </p>

            {DEMO_MODE && <div className="mt-8"><DemoRolePicker /></div>}

            <form onSubmit={onSubmit} className={DEMO_MODE ? 'mt-6 space-y-4 border-t border-line pt-6' : 'mt-8 space-y-4'}>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <input id="email" type="email" autoComplete="email" required className="input pl-11" placeholder="you@college.edu"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <input id="password" type="password" autoComplete="current-password" required className="input pl-11" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="rounded-2xl bg-rose-50/90 px-4 py-2.5 text-sm text-rose-700" role="alert">{error}</p>}
              <Button type="submit" size="lg" block loading={busy} icon={<ArrowUpRight className="h-4 w-4" />}>Sign in</Button>
            </form>

            {DEMO_MODE ? (
              <button onClick={resetDemo} className="mt-6 text-xs font-medium text-ink-mute hover:text-ink">Reset demo data</button>
            ) : (
              <p className="mt-8 flex items-center gap-2 text-xs text-ink-mute">
                <ShieldCheck className="h-4 w-4" /> Accounts are created by the placement cell admin.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
