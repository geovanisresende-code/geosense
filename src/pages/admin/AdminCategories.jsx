import { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { SectionTitle } from './ui'

export default function AdminCategories() {
  const { data, addCategory, updateCategory, removeCategory } = useData()
  const [novo, setNovo] = useState('')

  function handleAdd() {
    if (!novo.trim()) return
    addCategory(novo)
    setNovo('')
  }

  return (
    <div>
      <SectionTitle title="Categorias" description="As áreas exibidas na barra lateral e usadas para classificar cursos e materiais." />

      <div className="card max-w-xl p-5">
        <div className="flex gap-2">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nova categoria (ex.: Batimetria)"
            className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand"
          />
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"><Plus size={16} /> Adicionar</button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {data.categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Tag size={15} /></span>
              <input value={c.label} onChange={(e) => updateCategory(c.id, e.target.value)} className="flex-1 bg-transparent px-1 text-sm font-medium text-text outline-none" />
              <button onClick={() => removeCategory(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
            </div>
          ))}
          {data.categories.length === 0 && <p className="text-sm text-muted">Nenhuma categoria.</p>}
        </div>
      </div>
    </div>
  )
}
