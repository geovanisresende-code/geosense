import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, GraduationCap, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

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

        <ThemeToggle />

        <button className="relative grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text transition-colors">
          <Bell size={19} />
        </button>

        <div className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-300 text-slate-500">
            <User size={22} strokeWidth={2} fill="currentColor" stroke="none" />
          </span>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-text">{user?.name}</p>
            <p className="text-[11px] leading-tight text-muted">{user?.role === 'admin' ? 'Administrador' : 'Aluno'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="ml-1 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-rose-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
