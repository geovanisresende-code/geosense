import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { User, Lock, LogIn, FlaskConical, GraduationCap, Layers, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { user, login } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  function submit(e) {
    e.preventDefault()
    const res = login(username, password)
    if (!res.ok) return setError(res.message || 'Não foi possível entrar.')
    navigate(res.role === 'admin' ? '/admin' : '/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen bg-bg">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* Painel de marca */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d2236] to-[#08121d] p-12 text-white lg:flex">
        <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <Logo className="max-w-[210px] brightness-0 invert" />
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Plataforma de ensino <span className="text-brand">GeoSense</span>
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Cursos, materiais e o laboratório prático GeoSense Labs — tudo em um só lugar.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {[
              { icon: GraduationCap, t: 'Cursos e módulos', d: 'Aprenda no seu ritmo, do básico ao avançado.' },
              { icon: FlaskConical, t: 'GeoSense Labs', d: 'Experimentos reais e gamificados de geotecnologia.' },
              { icon: Layers, t: 'Biblioteca e calendário', d: 'Materiais de apoio e turmas presenciais.' },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                  <f.icon size={20} className="text-brand" />
                </span>
                <div>
                  <p className="font-semibold">{f.t}</p>
                  <p className="text-sm text-white/60">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} {data.settings.platformName} · {data.settings.tagline}</p>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo className="max-w-[180px]" />
          </div>

          <h2 className="text-2xl font-extrabold text-text">Entrar na plataforma</h2>
          <p className="mt-1 text-sm text-muted">Acesse com seu usuário para continuar.</p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text">Usuário</span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 focus-within:border-brand">
                <User size={18} className="text-muted" />
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  placeholder="seu usuário"
                  autoComplete="username"
                  className="w-full bg-transparent py-3 text-sm text-text outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text">Senha</span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 focus-within:border-brand">
                <Lock size={18} className="text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="sua senha"
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 text-sm text-text outline-none"
                />
              </div>
            </label>

            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}

            <button
              type="submit"
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-strong"
            >
              <LogIn size={18} /> Entrar
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">
            <Info size={15} className="mt-0.5 shrink-0 text-brand" />
            <span>
              <strong className="text-text">Acesso do administrador (protótipo):</strong> usuário <code className="rounded bg-surface-3 px-1">admin</code> e senha <code className="rounded bg-surface-3 px-1">123</code>. Qualquer outro usuário entra como aluno.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
