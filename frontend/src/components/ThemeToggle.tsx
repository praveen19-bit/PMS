import { Moon, Sun } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton label={`Switch to ${next} theme`} onClick={toggle} className={className}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </IconButton>
  )
}
