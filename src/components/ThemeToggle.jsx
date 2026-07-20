import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className={`flex h-9 items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 text-sm font-medium text-muted transition-colors hover:text-text ${className}`}
    >
      {theme === 'dark' ? <Sun size={17} className="text-brand" /> : <Moon size={17} className="text-brand" />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
    </button>
  )
}
