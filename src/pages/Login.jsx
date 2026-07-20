import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { User, Lock, Mail, LogIn, UserPlus, FlaskConical, GraduationCap, Layers, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { user, login, signup } = useAuth()
  const { data } = useData()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    const res = mode === 'login' ? await login(email, password) : await signup(name, email, password)
    setBusy(false)
    if (!res.ok) return setError(res.message)
    if (mode === 'signup') setInfo('Conta criada! Entrando…')
    // redirecionamento acontece automaticamente quando a sessão é criada
  }

  return (
    <div className="relative flex min-h-screen bg-bg">
      <div className="absolute right-5 top-5 z-10"><ThemeToggle /></div>

      {/* Painel de marca */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d2236] to-[#08121d] p-12 text-white lg:flex">
        <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <Logo className="max-w-[210px] brightness-0 invert" />
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">Plataforma de ensino <span className="text-brand">{data.settings.platformName}</span></h1>
          <p className="mt-4 max-w-md text-white/70">Cursos, materiais e o laboratório prático GeoSense Labs — tudo em um só lugar.</p>
          <ul className="mt-8 flex flex-col gap-4">
            {[
              { icon: GraduationCap, t: 'Cursos e módulos', d: 'Aprenda no seu ritmo, do básico ao avançado.' },
              { icon: FlaskConical, t: 'GeoSense Labs', d: 'Experimentos reais e gamificados de geotecnologia.' },
              { icon: Layers, t: 'Biblioteca e calendário', d: 'Materiais de apoio e turmas presenciais.' },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10"><f.icon size={20} className="text-brand" /></span>
                <div><p className="font-semibold">{f.t}</p><p className="text-sm text-white/60">{f.d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} {data.settings.platformName} · {data.settings.tagline}</p>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo className="max-w-[180px]" /></div>

          <h2 className="text-2xl font-extrabold text-text">{mode === 'login' ? 'Entrar na plataforma' : 'Criar sua conta'}</h2>
          <p className="mt-1 text-sm text-muted">{mode === 'login' ? 'Acesse com seu e-mail e senha.' : 'Preencha os dados para começar.'}</p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            {mode === 'signup' && (
              <LabeledInput icon={User} label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
            )}
            <LabeledInput icon={Mail} label={mode === 'login' ? 'E-mail ou usuário' : 'E-mail'} type={mode === 'login' ? 'text' : 'email'} value={email} onChange={setEmail} placeholder={mode === 'login' ? 'e-mail ou "admin"' : 'voce@email.com'} autoComplete="username" />
            <LabeledInput icon={Lock} label="Senha" type="password" value={password} onChange={setPassword} placeholder="mínimo 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
            {info && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{info}</p>}

            <button type="submit" disabled={busy} className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-strong disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }} className="font-semibold text-brand hover:underline">
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function LabeledInput({ icon: Icon, label, value, onChange, placeholder, type = 'text', autoComplete }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-text">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 focus-within:border-brand">
        <Icon size={18} className="text-muted" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full bg-transparent py-3 text-sm text-text outline-none" />
      </div>
    </label>
  )
}
