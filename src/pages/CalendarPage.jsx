import { CalendarDays, MapPin, Clock, Users, Monitor } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useData } from '../context/DataContext'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function parseDate(d) {
  if (!d) return null
  const parts = d.split('-')
  if (parts.length !== 3) return null
  return { y: +parts[0], m: +parts[1], day: +parts[2] }
}

export default function CalendarPage() {
  const { data } = useData()
  const events = [...data.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><CalendarDays size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Calendário</h1>
          <p className="text-sm text-muted">Turmas presenciais, lives e prazos importantes.</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-7">
          <EmptyState icon={CalendarDays} title="Nenhum evento agendado" description="Os eventos cadastrados no painel de controle aparecerão aqui em ordem de data." adminHint="Adicionar eventos" />
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-3">
          {events.map((e) => {
            const d = parseDate(e.date)
            const online = e.modality === 'online'
            return (
              <div key={e.id} className="card flex items-stretch gap-4 p-4">
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft py-2 text-brand">
                  <span className="text-2xl font-extrabold leading-none">{d ? String(d.day).padStart(2, '0') : '--'}</span>
                  <span className="text-xs font-semibold uppercase">{d ? MONTHS[d.m - 1] : ''}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-text">{e.title || 'Evento'}</h3>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${online ? 'bg-sky-500/10 text-sky-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {online ? <Monitor size={12} /> : <Users size={12} />}
                      {online ? 'Online' : e.modality === 'hibrido' ? 'Híbrido' : 'Presencial'}
                    </span>
                  </div>
                  {e.description && <p className="mt-1 text-sm text-muted">{e.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                    {e.time && <span className="flex items-center gap-1.5"><Clock size={14} /> {e.time}</span>}
                    {e.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {e.location}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
