import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

/** Glass bottom sheet on phones, centred glass dialog on larger screens. */
export function Modal({ open, onClose, title, description, children, footer }: Props) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('input,select,textarea')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[6px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-strong sheen relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-5xl sm:max-w-lg sm:rounded-5xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-4 sm:pt-6">
          <div>
            <h2 className="text-xl font-normal tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-mute">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-2">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-safe pt-4 sm:pb-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
