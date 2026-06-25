import { useLocation, Link } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'

export default function Placeholder() {
  const { pathname } = useLocation()
  const name = pathname.replace('/', '').replace(/-/g, ' ') || 'Página'
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-brand">
        <Construction size={36} />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold capitalize text-text">{name}</h1>
      <p className="mt-2 text-muted">
        Esta seção faz parte do protótipo da plataforma GeoSense e está em construção.
      </p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong">
        <ArrowLeft size={17} /> Voltar para Meus Cursos
      </Link>
    </div>
  )
}
