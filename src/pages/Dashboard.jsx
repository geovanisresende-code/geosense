import { Link } from 'react-router-dom'
import { SlidersHorizontal, ChevronDown, Plus, FlaskConical, ArrowRight } from 'lucide-react'
import CourseCard from '../components/CourseCard'
import ProgressFooter from '../components/ProgressFooter'
import { courses, user } from '../data/courses'

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text sm:text-4xl">Olá, {user.firstName}!</h1>
          <p className="mt-2 text-muted">Continue seus estudos e avance na sua jornada.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text shadow-sm hover:bg-surface-2 transition-colors">
          <SlidersHorizontal size={16} /> Todos os Cursos <ChevronDown size={16} className="text-muted" />
        </button>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}

        {/* Adicionar novo curso */}
        <button className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand/50 hover:bg-surface-2 animate-fade-up">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-brand text-brand">
            <Plus size={30} />
          </span>
          <span className="text-lg font-bold text-text">Adicionar Novo Curso</span>
          <span className="text-sm text-muted">Expandir seus conhecimentos nunca para.</span>
        </button>
      </div>

      {/* Faixa de destaque GeoSense Labs */}
      <Link
        to="/labs"
        className="mt-6 flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-strong p-6 text-white shadow-xl shadow-brand/20 sm:flex-row sm:items-center"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
          <FlaskConical size={28} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-[0.2em] text-white/80">NOVIDADE · APRENDA FAZENDO</p>
          <h2 className="mt-1 text-xl font-extrabold">GeoSense Labs — laboratório virtual de geotecnologias</h2>
          <p className="mt-1 text-sm text-white/85">
            Experimentos práticos com dados reais: planeje voos, detecte falhas GNSS, gere MDTs e compare seu resultado com o de um especialista.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand">
          Entrar no Labs <ArrowRight size={17} />
        </span>
      </Link>

      <ProgressFooter />
    </div>
  )
}
