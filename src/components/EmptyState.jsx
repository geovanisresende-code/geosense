import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function EmptyState({ icon: Icon, title, description, adminHint }) {
  const { user } = useAuth()
  return (
    <div className="card flex flex-col items-center justify-center gap-4 p-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-brand">
        <Icon size={30} />
      </span>
      <div>
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>
      </div>
      {user?.role === 'admin' && adminHint && (
        <Link to="/admin" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          {adminHint}
        </Link>
      )}
    </div>
  )
}
