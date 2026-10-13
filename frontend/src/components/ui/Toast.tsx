import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from './cn'

type ToastKind = 'success' | 'error'
interface ToastItem { id: number; kind: ToastKind; message: string }

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, kind, message }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="glass-strong pointer-events-auto flex max-w-md animate-fade-up items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-sm font-medium">
            <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', t.kind === 'success' ? 'bg-grad' : 'bg-coral')}>
              {t.kind === 'success' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
