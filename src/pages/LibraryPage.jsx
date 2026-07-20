import { useState } from 'react'
import { BookMarked, ExternalLink } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useData, categoryLabel } from '../context/DataContext'
import { libraryTypeMeta } from '../data/icons'

export default function LibraryPage() {
  const { data } = useData()
  const [filter, setFilter] = useState('all')

  const items = filter === 'all' ? data.library : data.library.filter((i) => i.category === filter)
  const usedCategories = data.categories.filter((c) => data.library.some((i) => i.category === c.id || i.category === c.label))

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><BookMarked size={22} /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Biblioteca</h1>
          <p className="text-sm text-muted">E-books, apostilas, vídeos e materiais de apoio.</p>
        </div>
      </div>

      {data.library.length === 0 ? (
        <div className="mt-7">
          <EmptyState icon={BookMarked} title="Biblioteca vazia" description="Os materiais cadastrados no painel de controle aparecerão aqui para os alunos." adminHint="Adicionar materiais" />
        </div>
      ) : (
        <>
          {usedCategories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => setFilter('all')} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === 'all' ? 'bg-brand text-white' : 'border border-border text-muted hover:text-text'}`}>Todos</button>
              {usedCategories.map((c) => (
                <button key={c.id} onClick={() => setFilter(c.id)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === c.id ? 'bg-brand text-white' : 'border border-border text-muted hover:text-text'}`}>{c.label}</button>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const meta = libraryTypeMeta(it.type)
              const Icon = meta.icon
              return (
                <a key={it.id} href={it.url || '#'} target={it.url ? '_blank' : undefined} rel="noreferrer" className="card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} /></span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">{meta.label}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text">{it.title || 'Material'}</h3>
                  {it.description && <p className="mt-1 flex-1 text-sm text-muted line-clamp-3">{it.description}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted">{categoryLabel(data.categories, it.category)}</span>
                    {it.url && <span className="flex items-center gap-1 font-semibold text-brand">Abrir <ExternalLink size={13} /></span>}
                  </div>
                </a>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
