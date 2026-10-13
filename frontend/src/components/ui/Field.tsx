import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  label: string
  htmlFor?: string
  hint?: string
  /** Error message; marks the field invalid. */
  error?: string | null
  /** Show the success state (field validated and OK). */
  valid?: boolean
  children: ReactNode
}

/**
 * Label + control + hint/validation message. Wires aria-invalid,
 * aria-describedby and data-valid onto the child input automatically.
 */
export function Field({ label, htmlFor, hint, error, valid, children }: Props) {
  const msgId = htmlFor ? `${htmlFor}-msg` : undefined
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? msgId : undefined,
        'data-valid': valid && !error ? 'true' : undefined,
      })
    : children
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      <div className="relative">
        {control}
        {valid && !error && <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" aria-hidden />}
      </div>
      {error ? (
        <p id={msgId} className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-xs text-ink-mute">{hint}</p>
      ) : null}
    </div>
  )
}
