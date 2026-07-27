import { Plus, Trash2, BookMarked } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { LIBRARY_TYPES } from '../../data/icons'
import { Field, TextArea, Select, SectionTitle } from './ui'

export default function AdminLibrary() {
  const { data, addLibraryItem, updateLibraryItem, removeLibraryItem } = useData()
  const categoryOptions = data.categories.map((c) => ({ value: c.id, label: c.label }))
  const typeOptions = LIBRARY_TYPES.map((t) => ({ value: t.value, label: t.label }))
  const courseOptions = data.courses.map((c) => ({ value: c.id, label: c.title || 'Sem título' }))

  function handleCourseChange(item, courseId) {
    // ao trocar de curso, o módulo escolhido antes deixa de fazer sentido
    updateLibraryItem(item.id, { courseId, moduleId: '' })
  }

  return (
    <div>
      <SectionTitle
        title="Biblioteca"
        description="E-books, apostilas, vídeos, artigos e links de apoio. Vincule a um curso e módulo para aparecer como material de apoio da aula, ou deixe solto (por categoria) para a biblioteca geral."
        action={
          <button onClick={() => addLibraryItem()} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
            <Plus size={16} /> Novo material
          </button>
        }
      />

      {data.library.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><BookMarked size={26} /></span>
          <p className="text-sm text-muted">Nenhum material cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.library.map((it) => {
            const course = data.courses.find((c) => c.id === it.courseId)
            const moduleOptions = (course?.modules || []).map((m) => ({ value: m.id, label: m.title }))
            return (
              <div key={it.id} className="card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Título" value={it.title} onChange={(v) => updateLibraryItem(it.id, { title: v })} placeholder="Ex.: Guia de Fotogrametria" /></div>
                  <Select label="Tipo" value={it.type} onChange={(v) => updateLibraryItem(it.id, { type: v })} options={typeOptions} />
                  <Select label="Categoria" value={it.category} onChange={(v) => updateLibraryItem(it.id, { category: v })} options={categoryOptions} placeholder="Selecione…" />

                  <div className="sm:col-span-2 rounded-xl border border-dashed border-border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Vincular a um curso (opcional)</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select label="Curso" value={it.courseId} onChange={(v) => handleCourseChange(it, v)} options={courseOptions} placeholder="Nenhum (biblioteca geral)" />
                      <Select
                        label="Módulo"
                        value={it.moduleId}
                        onChange={(v) => updateLibraryItem(it.id, { moduleId: v })}
                        options={moduleOptions}
                        placeholder={it.courseId ? 'Selecione…' : 'Escolha um curso primeiro'}
                      />
                    </div>
                    {it.courseId && (
                      <p className="mt-2 text-xs text-muted">
                        Vai aparecer como material de apoio {it.moduleId ? 'desse módulo' : 'desse curso'} para quem estiver assistindo.
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2"><Field label="Link (URL)" value={it.url} onChange={(v) => updateLibraryItem(it.id, { url: v })} placeholder="https://…" /></div>
                  <div className="sm:col-span-2"><TextArea label="Descrição" rows={2} value={it.description} onChange={(v) => updateLibraryItem(it.id, { description: v })} /></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => removeLibraryItem(it.id)} className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><Trash2 size={15} /> Excluir</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
