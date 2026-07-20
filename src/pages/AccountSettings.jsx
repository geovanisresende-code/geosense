import { useNavigate } from 'react-router-dom'
import { Settings, Sun, Moon, LogOut, ShieldCheck, Palette } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function AccountSettings() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-[700px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Settings size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Configurações</h1>
          <p className="text-sm text-muted">Preferências da sua conta.</p>
        </div>
      </div>

      <div className="card mt-7 divide-y divide-border">
        <div className="flex items-center gap-3 p-5">
          <Palette size={20} className="text-muted" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Aparência</p>
            <p className="text-xs text-muted">Tema {theme === 'dark' ? 'escuro' : 'claro'} ativado.</p>
          </div>
          <button onClick={toggleTheme} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text hover:bg-surface-3">
            {theme === 'dark' ? <Sun size={16} className="text-brand" /> : <Moon size={16} className="text-brand" />}
            Mudar para {theme === 'dark' ? 'claro' : 'escuro'}
          </button>
        </div>

        <div className="flex items-center gap-3 p-5">
          <ShieldCheck size={20} className="text-muted" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Conta</p>
            <p className="text-xs text-muted">{user?.email} · {user?.role === 'admin' ? 'Administrador' : 'Aluno'}</p>
          </div>
          <button onClick={() => navigate('/perfil')} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text hover:bg-surface-3">Ver perfil</button>
        </div>

        <div className="flex items-center gap-3 p-5">
          <LogOut size={20} className="text-muted" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Sair da conta</p>
            <p className="text-xs text-muted">Encerrar a sessão neste dispositivo.</p>
          </div>
          <button onClick={handleLogout} className="rounded-xl border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10">Sair</button>
        </div>
      </div>
    </div>
  )
}
