import { GraduationCap, Layers, CalendarDays, BookMarked } from 'lucide-react'
import { useData } from '../context/DataContext'

export default function CatalogSummary() {
  const { data } = useData()
  const modules = data.courses.reduce((s, c) => s + (c.modules?.length || 0), 0)

  const items = [
    { icon: GraduationCap, label: 'Cursos', value: data.courses.length },
    { icon: Layers, label: 'Módulos', value: modules },
    { icon: CalendarDays, label: 'Eventos', value: data.events.length },
    { icon: BookMarked, label: 'Biblioteca', value: data.library.length },
  ]

  return (
    <div className="card mt-6 grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <it.icon size={22} />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-text">{it.value}</p>
            <p className="text-xs text-muted">{it.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
