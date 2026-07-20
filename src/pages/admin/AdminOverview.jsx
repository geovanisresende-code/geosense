import { GraduationCap, Layers, CalendarDays, BookMarked, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { SectionTitle } from './ui'

export default function AdminOverview({ onGo }) {
  const { data } = useData()
  const modules = data.courses.reduce((s, c) => s + (c.modules?.length || 0), 0)
  const lessons = data.courses.reduce((s, c) => s + c.modules.reduce((a, m) => a + m.lessons.length, 0), 0)

  const stats = [
    { icon: GraduationCap, label: 'Cursos', value: data.courses.length, tab: 'cursos' },
    { icon: Layers, label: 'Módulos', value: modules, tab: 'cursos' },
    { icon: CalendarDays, label: 'Eventos', value: data.events.length, tab: 'calendario' },
    { icon: BookMarked, label: 'Biblioteca', value: data.library.length, tab: 'biblioteca' },
  ]

  // Checklist: o que ainda falta pegar com o cliente
  const checklist = [
    { done: data.courses.length > 0, label: 'Cadastrar os cursos', hint: 'Quais cursos a GeoSense oferece?', tab: 'cursos' },
    { done: modules > 0, label: 'Definir os módulos de cada curso', hint: 'Quantos módulos e quais aulas?', tab: 'cursos' },
    { done: lessons > 0, label: 'Adicionar as aulas (e vídeos)', hint: 'Títulos, durações e links dos vídeos.', tab: 'cursos' },
    { done: data.events.length > 0, label: 'Montar o calendário', hint: 'Turmas presenciais, lives e prazos.', tab: 'calendario' },
    { done: data.library.length > 0, label: 'Preencher a biblioteca', hint: 'E-books, apostilas e materiais de apoio.', tab: 'biblioteca' },
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const pct = Math.round((doneCount / checklist.length) * 100)

  return (
    <div>
      <SectionTitle title="Visão geral" description="Acompanhe o que já foi cadastrado e o que ainda falta pegar com o cliente." />

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

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-text">Informações a coletar com o cliente</h3>
            <p className="text-sm text-muted">Complete os itens abaixo para publicar a plataforma.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-brand">{doneCount}/{checklist.length}</span>
          </div>
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {checklist.map((c) => (
            <li key={c.label}>
              <button onClick={() => onGo(c.tab)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 text-left hover:border-brand/40">
                {c.done ? <CheckCircle2 size={20} className="shrink-0 text-success" /> : <Circle size={20} className="shrink-0 text-muted/50" />}
                <span className="flex-1">
                  <span className={`block text-sm font-semibold ${c.done ? 'text-muted line-through' : 'text-text'}`}>{c.label}</span>
                  <span className="block text-xs text-muted">{c.hint}</span>
                </span>
                <ArrowRight size={16} className="text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
