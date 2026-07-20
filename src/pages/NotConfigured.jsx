import { Database } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

export default function NotConfigured() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 max-w-[200px]"><Logo /></div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-brand"><Database size={30} /></span>
        <h1 className="mt-5 text-2xl font-extrabold text-text">Backend ainda não configurado</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Falta conectar o banco de dados (Supabase). Defina as variáveis
          <code className="mx-1 rounded bg-surface-3 px-1">VITE_SUPABASE_URL</code> e
          <code className="mx-1 rounded bg-surface-3 px-1">VITE_SUPABASE_ANON_KEY</code>
          no ambiente (arquivo <code className="rounded bg-surface-3 px-1">.env</code> local e nas variáveis da Vercel) e recarregue.
        </p>
        <p className="mt-4 text-xs text-muted">Consulte o arquivo <code className="rounded bg-surface-3 px-1">SETUP.md</code> do projeto.</p>
      </div>
    </div>
  )
}
