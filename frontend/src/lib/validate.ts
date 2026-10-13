/** Tiny form-validation helpers shared by the forms. Each returns an error message or null. */
export const rules = {
  required: (v: string | null | undefined, what = 'This field') => (v && v.trim() ? null : `${what} is required`),
  email: (v: string) => (!v.trim() ? 'Email is required' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'Enter a valid email address'),
  minLength: (v: string, n: number, what = 'This field') => (v.length >= n ? null : `${what} must be at least ${n} characters`),
  range: (v: number, min: number, max: number, what = 'Value') => (Number.isFinite(v) && v >= min && v <= max ? null : `${what} must be between ${min} and ${max}`),
}

export type Errors<K extends string> = Partial<Record<K, string | null>>

export const hasErrors = <K extends string>(e: Errors<K>) => Object.values(e).some(Boolean)

/** % change from previous to current (100 when growing from zero). */
export const pctChange = (current: number, previous: number) =>
  previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100
