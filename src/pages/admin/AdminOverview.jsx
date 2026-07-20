import { GraduationCap, Layers, CalendarDays, BookMarked } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { SectionTitle } from './ui'

export default function AdminOverview({ onGo }) {
  const { data } = useData()
  const modules = data.courses.reduce((s, c) => s + (c.modules?.length || 0), 0)

  const stats = [
    { icon: GraduationCap, label: 'Cursos', value: data.courses.length, tab: 'cursos' },
    { icon: Layers, label: 'Módulos', value: modules, tab: 'cursos' },
    { icon: CalendarDays, label: 'Eventos', value: data.events.length, tab: 'calendario' },
    { icon: BookMarked, label: 'Biblioteca', value: data.library.length, tab: 'biblioteca' },
  ]

  return (
    <div>
      <SectionTitle title="Visão geral" description="Acompanhe o que já foi cadastrado na plataforma." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onGo(s.tab)} className="card flex items-center gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand"><s.icon size={22} /></span>
            <div>
              <p className="text-2xl font-extrabold text-text">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
