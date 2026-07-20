import { Plus, Trash2, CalendarDays } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { MODALITIES } from '../../data/icons'
import { Field, TextArea, Select, SectionTitle } from './ui'

export default function AdminCalendar() {
  const { data, addEvent, updateEvent, removeEvent } = useData()

  return (
    <div>
      <SectionTitle
        title="Calendário"
        description="Turmas presenciais, lives, aberturas de inscrição e prazos. (Info a pegar com o cliente.)"
        action={
          <button onClick={() => addEvent({ title: 'Novo evento' })} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
            <Plus size={16} /> Novo evento
          </button>
        }
      />

      {data.events.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><CalendarDays size={26} /></span>
          <p className="text-sm text-muted">Nenhum evento cadastrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.events.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Título" value={e.title} onChange={(v) => updateEvent(e.id, { title: v })} placeholder="Ex.: Turma presencial de Topografia" /></div>
                <Field label="Data" type="date" value={e.date} onChange={(v) => updateEvent(e.id, { date: v })} />
                <Field label="Horário" value={e.time} onChange={(v) => updateEvent(e.id, { time: v })} placeholder="Ex.: 09h às 17h" />
                <Select label="Modalidade" value={e.modality} onChange={(v) => updateEvent(e.id, { modality: v })} options={MODALITIES} />
                <Field label="Local" value={e.location} onChange={(v) => updateEvent(e.id, { location: v })} placeholder="Cidade / plataforma / link" />
                <div className="sm:col-span-2"><TextArea label="Descrição" rows={2} value={e.description} onChange={(v) => updateEvent(e.id, { description: v })} /></div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => removeEvent(e.id)} className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><Trash2 size={15} /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
