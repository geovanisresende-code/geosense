import { Award, GraduationCap, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData, categoryLabel } from '../context/DataContext'
import EmptyState from '../components/EmptyState'

export default function Certificates() {
  const { user } = useAuth()
  const { data, progress } = useData()

  const courses = data.courses.map((c) => {
    const all = c.modules.flatMap((m) => m.lessons)
    const done = all.filter((l) => progress.has(l.id)).length
    const pct = all.length ? Math.round((done / all.length) * 100) : 0
    return { ...c, total: all.length, done, pct, certified: all.length > 0 && done === all.length }
  })
  const certified = courses.filter((c) => c.certified)
  const inProgress = courses.filter((c) => !c.certified && c.done > 0)

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Award size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Certificados</h1>
          <p className="text-sm text-muted">Conclua todas as aulas de um curso para emitir o certificado.</p>
        </div>
      </div>

      {certified.length === 0 && inProgress.length === 0 ? (
        <div className="mt-7">
          <EmptyState icon={Award} title="Nenhum certificado ainda" description="Assim que você concluir todas as aulas de um curso, o certificado aparece aqui." />
        </div>
      ) : (
        <>
          {certified.length > 0 && (
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {certified.map((c) => (
                <div key={c.id} className="card overflow-hidden">
                  <div className="border-b-4 border-brand bg-gradient-to-br from-[#0d2236] to-[#08121d] p-6 text-white">
                    <div className="flex items-center justify-between">
                      <Award size={30} className="text-brand" />
                      <span className="rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand">CONCLUÍDO</span>
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-widest text-white/50">Certificado de conclusão</p>
                    <h3 className="mt-1 text-lg font-bold">{c.title}</h3>
                    <p className="mt-3 text-sm text-white/70">Conferido a</p>
                    <p className="text-base font-semibold">{user?.name}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 text-sm">
                    <span className="text-muted">{categoryLabel(data.categories, c.category)}</span>
                    <span className="flex items-center gap-1 font-semibold text-success"><CheckCircle2 size={15} /> {c.total} aulas</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inProgress.length > 0 && (
            <div className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-text"><GraduationCap size={20} className="text-brand" /> Em andamento</h2>
              <div className="mt-4 flex flex-col gap-3">
                {inProgress.map((c) => (
                  <div key={c.id} className="card flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text">{c.title}</p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand">{c.done}/{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
