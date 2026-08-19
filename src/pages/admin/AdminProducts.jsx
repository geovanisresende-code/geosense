import { useState } from 'react'
import { RefreshCw, ShoppingBag, UploadCloud, ExternalLink, Check, AlertTriangle } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Field, TextArea, Select, SectionTitle } from './ui'
import { storeProductUrl } from '../../lib/shopify'

const STATUS = [
  { value: 'active', label: 'Ativo' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'archived', label: 'Arquivado' },
]

const BADGE = {
  active: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-amber-500/10 text-amber-600',
  archived: 'bg-slate-500/10 text-slate-500',
}

const moeda = (v) =>
  v === '' || v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminProducts() {
  const { data, updateProduct, syncProducts, pushProduct } = useData()
  const cursoOptions = data.courses.map((c) => ({ value: c.id, label: c.title || 'Sem título' }))
  const [sincronizando, setSincronizando] = useState(false)
  const [aviso, setAviso] = useState(null)          // { tipo: 'ok'|'erro', texto }
  const [enviando, setEnviando] = useState({})       // { [id]: 'enviando'|'ok'|'erro' }

  async function handleSync() {
    setSincronizando(true)
    setAviso(null)
    try {
      const r = await syncProducts()
      setAviso({ tipo: 'ok', texto: `${r.sincronizados} produto(s) sincronizado(s)${r.removidos ? ` · ${r.removidos} removido(s)` : ''}.` })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message })
    } finally {
      setSincronizando(false)
    }
  }

  async function handlePush(prod) {
    setEnviando((s) => ({ ...s, [prod.id]: 'enviando' }))
    setAviso(null)
    try {
      await pushProduct(prod.id)
      setEnviando((s) => ({ ...s, [prod.id]: 'ok' }))
      setTimeout(() => setEnviando((s) => ({ ...s, [prod.id]: undefined })), 2500)
    } catch (e) {
      setEnviando((s) => ({ ...s, [prod.id]: 'erro' }))
      setAviso({ tipo: 'erro', texto: e.message })
    }
  }

  return (
    <div>
      <SectionTitle
        title="Produtos"
        description="Espelho da loja Shopify. Sincronize para trazer o catálogo, edite aqui (salva no banco na hora) e clique em “Enviar para a Shopify” para publicar a alteração na loja."
        action={
          <button
            onClick={handleSync}
            disabled={sincronizando}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
            {sincronizando ? 'Sincronizando…' : 'Sincronizar com a Shopify'}
          </button>
        }
      />

      {aviso && (
        <div className={`mb-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${aviso.tipo === 'ok' ? 'border-emerald-500/40 text-emerald-600' : 'border-rose-500/40 text-rose-500'}`}>
          {aviso.tipo === 'ok' ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
          <span>{aviso.texto}</span>
        </div>
      )}

      {data.products.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><ShoppingBag size={26} /></span>
          <p className="text-sm text-muted">Nenhum produto ainda. Clique em “Sincronizar com a Shopify” para trazer o catálogo da loja.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.products.map((p) => {
            const estado = enviando[p.id]
            return (
              <div key={p.id} className="card p-5">
                <div className="mb-4 flex items-start gap-3">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><ShoppingBag size={22} /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text">{p.title || 'Sem título'}</p>
                    <p className="text-xs text-muted">{moeda(p.price)} · ID {p.shopifyId}</p>
                    <span className={`mt-1.5 inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold ${BADGE[p.status] || BADGE.draft}`}>
                      {STATUS.find((s) => s.value === p.status)?.label || p.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Título" value={p.title} onChange={(v) => updateProduct(p.id, { title: v })} /></div>
                  <Field label="Preço (R$)" value={p.price} onChange={(v) => updateProduct(p.id, { price: v })} placeholder="0,00" hint={p.variantId ? undefined : 'Sem variante sincronizada — o preço não sobe para a Shopify.'} />
                  <Select label="Situação" value={p.status} onChange={(v) => updateProduct(p.id, { status: v })} options={STATUS} />
                  <div className="sm:col-span-2">
                    <TextArea label="Descrição (aceita HTML)" rows={3} value={p.description} onChange={(v) => updateProduct(p.id, { description: v })} />
                  </div>

                  <div className="sm:col-span-2 rounded-xl border border-dashed border-border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Acesso pago</p>
                    <Select
                      label="Curso liberado por este produto"
                      value={p.courseId}
                      onChange={(v) => updateProduct(p.id, { courseId: v })}
                      options={cursoOptions}
                      placeholder="Nenhum (curso aberto a todos)"
                    />
                    <p className="mt-2 text-xs text-muted">
                      {p.courseId
                        ? 'Só quem comprar este produto na loja vê o conteúdo do curso. Quem ainda não comprou vê a tela de bloqueio com o botão de compra.'
                        : 'Vincule um curso para trancá-lo atrás da compra. Este campo fica só na plataforma — não vai para a Shopify.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  {p.handle && (
                    <a
                      href={storeProductUrl(p.handle)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text"
                    >
                      <ExternalLink size={15} /> Ver na loja
                    </a>
                  )}
                  <button
                    onClick={() => handlePush(p)}
                    disabled={estado === 'enviando'}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:opacity-60 ${estado === 'ok' ? 'bg-emerald-500/10 text-emerald-600' : 'border border-border text-text hover:bg-surface-2'}`}
                  >
                    {estado === 'ok' ? <Check size={15} /> : <UploadCloud size={15} />}
                    {estado === 'enviando' ? 'Enviando…' : estado === 'ok' ? 'Enviado' : 'Enviar para a Shopify'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
