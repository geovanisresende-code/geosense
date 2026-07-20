import { Plus, Trash2, Megaphone } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Field, TextArea, SectionTitle } from './ui'

export default function AdminAnnouncements() {
  const { data, addAnnouncement, updateAnnouncement, removeAnnouncement } = useData()

  return (
    <div>
      <SectionTitle
        title="Avisos"
        description="Comunicados para os alunos — aparecem na aba Mensagens da plataforma."
        action={
          <button onClick={() => addAnnouncement({ title: 'Novo aviso' })} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
            <Plus size={16} /> Novo aviso
          </button>
        }
      />

      {data.announcements.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone size={26} /></span>
          <p className="text-sm text-muted">Nenhum aviso publicado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.announcements.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-col gap-4">
                <Field label="Título" value={a.title} onChange={(v) => updateAnnouncement(a.id, { title: v })} placeholder="Ex.: Nova turma presencial em julho" />
                <TextArea label="Mensagem" rows={3} value={a.body} onChange={(v) => updateAnnouncement(a.id, { body: v })} placeholder="Escreva o comunicado…" />
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => removeAnnouncement(a.id)} className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><Trash2 size={15} /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
