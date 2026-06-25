import { useNavigate } from 'react-router-dom'
import { Plane, Box, PieChart, BookOpen, Clock, ArrowRight, Users } from 'lucide-react'

const icons = { drone: Plane, cube: Box, chart: PieChart }

const heroBg = {
  drone: 'from-[#1c3a52] to-[#0d2236]',
  cube: 'from-[#10314a] to-[#071f33]',
  chart: 'from-[#16344c] to-[#0a2335]',
}

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const Icon = icons[course.icon] || Plane

  return (
    <div className="card group flex flex-col overflow-hidden animate-fade-up">
      {/* hero */}
      <div className={`relative flex h-44 flex-col items-center justify-center bg-gradient-to-br ${heroBg[course.icon]}`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(249,115,22,0.4), transparent 60%)' }} />
        {course.badge && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white">
            <Users size={13} /> {course.badge}
          </span>
        )}
        <Icon size={52} className="text-white/90" strokeWidth={1.4} />
        <span className="mt-3 text-sm font-bold tracking-[0.2em] text-white/90">{course.tag}</span>
        <span className="mt-2 h-1 w-10 rounded-full bg-brand" />
      </div>

      {/* progress */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-brand" style={{ width: `${course.progress}%` }} />
        </div>
        <span className="text-xs font-medium text-muted">{course.progress}% Completo</span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="text-lg font-bold leading-snug text-text">{course.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{course.description}</p>

        <div className="mt-4 flex items-center gap-5 text-xs text-muted">
          <span className="flex items-center gap-1.5"><BookOpen size={15} /> {course.modules} Módulos</span>
          <span className="flex items-center gap-1.5"><Clock size={15} /> {course.hours}</span>
        </div>

        <button
          onClick={() => navigate(`/curso/${course.id}`)}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-strong group-hover:gap-3"
        >
          Continuar <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
