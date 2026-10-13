import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, CalendarCheck, Eye, EyeOff, LineChart, MessagesSquare } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { useFormValidation } from '@/hooks/useFormValidation'
import { rules } from '@/lib/validate'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { Card } from '@/components/ui/Card'
import { FullPageSpinner } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/hooks/useRole'
import { DEMO_MODE } from '@/lib/config'
import { supabaseUrl } from '@/lib/supabaseClient'
import { DemoRolePicker } from '@/components/DemoRolePicker'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useChartColors } from '@/components/charts'
import { resetDemo } from '@/components/DemoBanner'

/** Decorative curve for the intro panel (no data, purely illustrative). */
function HeroCurve() {
  const c = useChartColors()
  return (
    <svg viewBox="0 0 400 150" className="h-40 w-full" aria-hidden>
      <defs>
        <linearGradient id="hc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 65, 100, 135].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke={c.grid} />)}
      <path d="M0 120 C40 100 60 70 95 90 S150 120 185 85 S240 20 270 30 S320 95 350 80 S385 70 400 75 V150 H0Z" fill="url(#hc-fill)" />
      <path d="M0 120 C40 100 60 70 95 90 S150 120 185 85 S240 20 270 30 S320 95 350 80 S385 70 400 75" fill="none" stroke={c.primary} strokeWidth="3" strokeLinecap="round" />
      <circle cx="270" cy="30" r="6" fill={c.dotFill} stroke={c.primary} strokeWidth="3" />
    </svg>
  )
}

export default function Login() {
  const { session, initializing, me, meLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const v = useFormValidation({ email: rules.email(email), password: rules.required(password, 'Password') })

  if (initializing || (session && meLoading)) return <FullPageSpinner />
  if (session && me) return <Navigate to={HOME_BY_ROLE[me.profile.role]} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!v.check()) return
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

  const features = [
    { icon: CalendarCheck, title: 'Daily attendance', text: 'One-tap marking for every batch' },
    { icon: MessagesSquare, title: 'Interview rounds', text: 'Every stage, with remarks' },
    { icon: LineChart, title: 'Live analytics', text: 'Attendance and placement funnel' },
  ]

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-4 py-8 lg:grid-cols-2 lg:gap-10 lg:px-8">
      {/* Intro (desktop) */}
      <section className="hidden lg:block">
        <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
        <h2 className="mt-10 text-4xl font-semibold leading-tight tracking-tight">
          Placements, <span className="text-grad">on track.</span>
        </h2>
        <p className="mt-3 max-w-md text-ink-soft">Attendance, company drives and interview progress for your fastrack batches — all in one place.</p>
        <Card className="mt-8 p-6">
          <p className="text-sm font-medium">placement progress</p>
          <HeroCurve />
        </Card>
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Card className="h-full p-4">
                <span className="bg-grad grid h-9 w-9 place-items-center rounded-xl text-white shadow-glow"><Icon className="h-4 w-4" /></span>
                <p className="mt-3 text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-xs text-ink-mute">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Login card */}
      <section className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between lg:hidden"><Logo /><ThemeToggle /></div>
        <Card className="p-6 sm:p-8">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Hi,<br /><span className="text-grad">Welcome back.</span></h1>
          <p className="mt-2 text-sm text-ink-mute">
            {DEMO_MODE ? 'Pick a role to explore with sample data.' : 'Sign in with the account issued by your placement cell.'}
          </p>

          {DEMO_MODE && <div className="mt-6"><DemoRolePicker /></div>}

          <form noValidate onSubmit={onSubmit} className={DEMO_MODE ? 'mt-6 space-y-4 border-t border-line pt-6' : 'mt-8 space-y-4'}>
            <Field label="Email" htmlFor="email" {...v.field('email')}>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="username@mail.com"
                value={email} onChange={(e) => setEmail(e.target.value)} onBlur={v.blur('email')} />
            </Field>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-12" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} onBlur={v.blur('password')}
                  aria-invalid={v.field('password').error ? true : undefined} aria-describedby={v.field('password').error ? 'password-msg' : undefined} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute hover:text-brand-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {v.field('password').error && (
                <p id="password-msg" className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert"><AlertCircle className="h-3.5 w-3.5" />{v.field('password').error}</p>
              )}
              {!DEMO_MODE && <p className="mt-1.5 text-right text-[11px] text-brand-600">Forgot password? Ask your placement admin.</p>}
            </div>
            {error && <p className="rounded-xl bg-danger/15 px-4 py-2.5 text-sm text-danger" role="alert">{error}</p>}
            <Button type="submit" size="lg" block loading={busy}>login</Button>
          </form>

          {DEMO_MODE && (
            <button onClick={resetDemo} className="mt-5 w-full text-center text-xs text-ink-mute hover:text-brand-600">Reset demo data</button>
          )}
        </Card>
      </section>
    </div>
  )
}
