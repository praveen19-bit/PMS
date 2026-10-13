import { useCallback, useState } from 'react'
import { hasErrors, type Errors } from '@/lib/validate'

/**
 * Shows a field's error once it has been blurred or the form submitted,
 * and its success state once it has been touched and is valid.
 */
export function useFormValidation<K extends string>(errors: Errors<K>) {
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const show = (k: K) => submitted || Boolean(touched[k])
  const field = (k: K) => ({
    error: show(k) ? errors[k] ?? null : null,
    valid: show(k) && !errors[k],
  })
  const blur = (k: K) => () => setTouched((t) => ({ ...t, [k]: true }))
  /** Call on submit; returns true when the form may be sent. */
  const check = () => {
    setSubmitted(true)
    return !hasErrors(errors)
  }
  const reset = useCallback(() => {
    setTouched({})
    setSubmitted(false)
  }, [])

  return { field, blur, check, reset }
}
