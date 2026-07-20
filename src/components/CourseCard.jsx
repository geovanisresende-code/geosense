import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, ArrowRight, Users } from 'lucide-react'
import { ACCENT_ICONS } from '../data/icons'
import { useData, categoryLabel } from '../context/DataContext'

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const { data } = useData()
  const Icon = ACCENT_ICONS[course.accent] || ACCENT_ICONS.cap
  const lessons = course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0
  const catLabel = categoryLabel(data.categories, course.category)

  return (
    <div className="card group flex flex-col overflow-hidden animate-fade-up">
      <div className="relative flex h-44 flex-col items-center justify-center bg-gradient-to-br from-[#1c3a52] to-[#0d2236]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(249,115,22,0.4), transparent 60%)' }} />
        {(course.modality === 'presencial' || course.modality === 'hibrido') && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white">
            <Users size={13} /> {course.modality === 'hibrido' ? 'Híbrido' : 'Presencial'}
          </span>
        )}
        <Icon size={52} className="text-white/90" strokeWidth={1.4} />
        {catLabel && <span className="mt-3 text-sm font-bold uppercase tracking-[0.15em] text-white/90">{catLabel}</span>}
        <span className="mt-2 h-1 w-10 rounded-full bg-brand" />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-lg font-bold leading-snug text-text">{course.title || 'Curso sem título'}</h3>
        {course.description && <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{course.description}</p>}

        <div className="mt-4 flex items-center gap-5 text-xs text-muted">
          <span className="flex items-center gap-1.5"><BookOpen size={15} /> {course.modules?.length || 0} Módulos</span>
          {course.hours && <span className="flex items-center gap-1.5"><Clock size={15} /> {course.hours}</span>}
          {!course.hours && lessons > 0 && <span className="flex items-center gap-1.5"><Clock size={15} /> {lessons} aulas</span>}
        </div>

        <button
          onClick={() => navigate(`/curso/${course.id}`)}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-strong group-hover:gap-3"
        >
          Acessar curso <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
