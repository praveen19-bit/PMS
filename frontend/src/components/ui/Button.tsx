import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-grad text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-subtle',
  soft: 'bg-subtle text-ink-soft hover:text-ink',
  ghost: 'text-ink-soft hover:bg-subtle hover:text-ink',
  danger: 'bg-surface text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger/10',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-4 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-[15px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/** Round icon button; `active` fills it with the violet gradient. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, active, size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'grid shrink-0 place-items-center rounded-full transition active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10',
        active ? 'bg-grad text-white shadow-glow' : 'bg-surface text-ink-soft ring-1 ring-line hover:bg-subtle hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
