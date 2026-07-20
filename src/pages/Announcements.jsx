import { Mail, Megaphone } from 'lucide-react'
import { useData } from '../context/DataContext'
import EmptyState from '../components/EmptyState'

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function Announcements() {
  const { data } = useData()

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Mail size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Mensagens</h1>
          <p className="text-sm text-muted">Avisos e comunicados da equipe.</p>
        </div>
      </div>

      {data.announcements.length === 0 ? (
        <div className="mt-7">
          <EmptyState icon={Megaphone} title="Nenhuma mensagem" description="Os comunicados publicados pela equipe aparecerão aqui." adminHint="Publicar avisos" />
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-4">
          {data.announcements.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Megaphone size={19} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-text">{a.title}</h3>
                    <span className="text-xs text-muted">{timeAgo(a.created_at)}</span>
                  </div>
                  {a.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{a.body}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
