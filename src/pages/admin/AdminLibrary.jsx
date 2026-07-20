import { Plus, Trash2, BookMarked } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { LIBRARY_TYPES } from '../../data/icons'
import { Field, TextArea, Select, SectionTitle } from './ui'

export default function AdminLibrary() {
  const { data, addLibraryItem, updateLibraryItem, removeLibraryItem } = useData()
  const categoryOptions = data.categories.map((c) => ({ value: c.id, label: c.label }))
  const typeOptions = LIBRARY_TYPES.map((t) => ({ value: t.value, label: t.label }))

  return (
    <div>
      <SectionTitle
        title="Biblioteca"
        description="E-books, apostilas, vídeos, artigos e links de apoio. (Info a pegar com o cliente.)"
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
          {data.library.map((it) => (
            <div key={it.id} className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Título" value={it.title} onChange={(v) => updateLibraryItem(it.id, { title: v })} placeholder="Ex.: Guia de Fotogrametria" /></div>
                <Select label="Tipo" value={it.type} onChange={(v) => updateLibraryItem(it.id, { type: v })} options={typeOptions} />
                <Select label="Categoria" value={it.category} onChange={(v) => updateLibraryItem(it.id, { category: v })} options={categoryOptions} placeholder="Selecione…" />
                <div className="sm:col-span-2"><Field label="Link (URL)" value={it.url} onChange={(v) => updateLibraryItem(it.id, { url: v })} placeholder="https://…" /></div>
                <div className="sm:col-span-2"><TextArea label="Descrição" rows={2} value={it.description} onChange={(v) => updateLibraryItem(it.id, { description: v })} /></div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => removeLibraryItem(it.id)} className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><Trash2 size={15} /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
