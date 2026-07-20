import { useState } from 'react'
import { User, Mail, ShieldCheck, GraduationCap, Save, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function Profile() {
  const { user, updateName } = useAuth()
  const { data, progress } = useData()
  const [name, setName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)

  const completedLessons = progress.size
  const certified = data.courses.filter((c) => {
    const all = c.modules.flatMap((m) => m.lessons)
    return all.length > 0 && all.every((l) => progress.has(l.id))
  }).length

  async function save() {
    await updateName(name.trim() || user.name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><User size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Perfil</h1>
          <p className="text-sm text-muted">Suas informações e progresso.</p>
        </div>
      </div>

      <div className="mt-7 flex items-center gap-4 card p-6">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-300 text-slate-500"><User size={34} fill="currentColor" stroke="none" /></span>
        <div>
          <p className="text-lg font-bold text-text">{user?.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted"><Mail size={14} /> {user?.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            <ShieldCheck size={12} /> {user?.role === 'admin' ? 'Administrador' : 'Aluno'}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Check size={22} /></span>
          <div><p className="text-2xl font-extrabold text-text">{completedLessons}</p><p className="text-xs text-muted">Aulas concluídas</p></div>
        </div>
        <div className="card flex items-center gap-3 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><GraduationCap size={22} /></span>
          <div><p className="text-2xl font-extrabold text-text">{certified}</p><p className="text-xs text-muted">Certificados conquistados</p></div>
        </div>
      </div>

      <div className="card mt-5 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Editar dados</h3>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text">Nome completo</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand" />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text">E-mail</span>
          <input value={user?.email || ''} disabled className="w-full cursor-not-allowed rounded-xl border border-border bg-surface-3 px-3 py-2.5 text-sm text-muted outline-none" />
        </label>
        <button onClick={save} className="mt-5 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> Salvar alterações</>}
        </button>
      </div>
    </div>
  )
}
