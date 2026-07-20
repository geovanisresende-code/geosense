import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, CalendarDays, BookMarked, Tag, Settings,
  ShieldCheck, ArrowUpRight, LogOut, Megaphone,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import Loader from '../../components/Loader'
import AdminOverview from './AdminOverview'
import AdminCourses from './AdminCourses'
import AdminCalendar from './AdminCalendar'
import AdminLibrary from './AdminLibrary'
import AdminCategories from './AdminCategories'
import AdminAnnouncements from './AdminAnnouncements'
import AdminSettings from './AdminSettings'

const TABS = [
  { id: 'visao', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'cursos', label: 'Cursos', icon: GraduationCap },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'biblioteca', label: 'Biblioteca', icon: BookMarked },
  { id: 'avisos', label: 'Avisos', icon: Megaphone },
  { id: 'categorias', label: 'Categorias', icon: Tag },
  { id: 'config', label: 'Configurações', icon: Settings },
]

export default function Admin() {
  const [tab, setTab] = useState('visao')
  const { logout } = useAuth()
  const { loading } = useData()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* sidebar do painel */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo className="max-w-[170px]" />
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-text px-3.5 py-2.5 text-sm font-semibold text-surface">
          <ShieldCheck size={18} /> Painel de Controle
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2 hover:text-text'}`}>
                <t.icon size={19} />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold text-text hover:bg-surface-2">
            <ArrowUpRight size={17} /> Ver plataforma
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-rose-500/10 hover:text-rose-500">
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topo */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-semibold text-text lg:hidden">
            <ShieldCheck size={18} className="text-brand" /> Painel
          </div>
          {/* seletor de aba no mobile */}
          <select value={tab} onChange={(e) => setTab(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-text lg:hidden">
            {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/')} className="hidden items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2 sm:flex">
              <ArrowUpRight size={16} /> Ver plataforma
            </button>
            <button onClick={handleLogout} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-rose-500/10 hover:text-rose-500 lg:hidden">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 py-7 sm:px-8">
          <div className="mx-auto max-w-[1200px]">
            {loading ? (
              <Loader label="Carregando o painel…" />
            ) : (
              <>
                {tab === 'visao' && <AdminOverview onGo={setTab} />}
                {tab === 'cursos' && <AdminCourses />}
                {tab === 'calendario' && <AdminCalendar />}
                {tab === 'biblioteca' && <AdminLibrary />}
                {tab === 'avisos' && <AdminAnnouncements />}
                {tab === 'categorias' && <AdminCategories />}
                {tab === 'config' && <AdminSettings />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
