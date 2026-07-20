import { Link } from 'react-router-dom'
import { GraduationCap, FlaskConical, ArrowRight, Settings2 } from 'lucide-react'
import CourseCard from '../components/CourseCard'
import CatalogSummary from '../components/CatalogSummary'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { data } = useData()
  const firstName = user?.name?.split(' ')[0] || 'aluno'

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text sm:text-4xl">Olá, {firstName}!</h1>
          <p className="mt-2 text-muted">Continue seus estudos e avance na sua jornada.</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/admin" className="flex items-center gap-2 rounded-xl bg-text px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-90">
            <Settings2 size={16} /> Gerenciar conteúdo
          </Link>
        )}
      </div>

      {data.courses.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={GraduationCap}
            title="Nenhum curso cadastrado ainda"
            description="Assim que os cursos forem adicionados no painel de controle, eles aparecerão aqui para os alunos."
            adminHint="Adicionar cursos"
          />
        </div>
      ) : (
        <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      {/* Faixa de destaque GeoSense Labs */}
      <Link
        to="/labs"
        className="mt-6 flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-strong p-6 text-white shadow-xl shadow-brand/20 sm:flex-row sm:items-center"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
          <FlaskConical size={28} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-[0.2em] text-white/80">APRENDA FAZENDO</p>
          <h2 className="mt-1 text-xl font-extrabold">GeoSense Labs — laboratório virtual de geotecnologias</h2>
          <p className="mt-1 text-sm text-white/85">
            Experimentos práticos: planeje voos, detecte falhas GNSS, gere MDTs e compare seu resultado com o de um especialista.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand">
          Entrar no Labs <ArrowRight size={17} />
        </span>
      </Link>

      <CatalogSummary />
    </div>
  )
}
