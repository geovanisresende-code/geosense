import { Link } from 'react-router-dom'
import { Search, Bell, ChevronDown, Sun, Moon, GraduationCap, User } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { user } from '../data/courses'

export default function Topbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface/80 px-5 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-text">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
          <GraduationCap size={17} />
        </span>
        Meus Cursos
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text transition-colors">
          <Search size={19} />
        </button>

        {/* Alternador de tema dark / light */}
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="group relative flex h-9 items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 text-sm font-medium text-muted hover:text-text transition-colors"
        >
          {theme === 'dark' ? <Sun size={17} className="text-brand" /> : <Moon size={17} className="text-brand" />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
        </button>

        <button className="relative grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text transition-colors">
          <Bell size={19} />
          <span className="absolute -right-0.5 -top-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white" style={{ height: 18, width: 18 }}>
            3
          </span>
        </button>

        <div className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface-2 transition-colors cursor-pointer">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-300 text-slate-500">
            <User size={22} strokeWidth={2} fill="currentColor" stroke="none" />
          </span>
          <span className="hidden sm:inline text-sm font-semibold text-text">{user.name}</span>
          <ChevronDown size={16} className="text-muted" />
        </div>
      </div>
    </header>
  )
}
