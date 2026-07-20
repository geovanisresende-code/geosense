import { useState } from 'react'
import { Download, Trash2, Save } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Field, SectionTitle } from './ui'

export default function AdminSettings() {
  const { data, updateSettings, exportData, clearAllContent } = useData()
  const [msg, setMsg] = useState('')

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `geosense-dados-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClear() {
    if (!confirm('Tem certeza? Isso apaga TODOS os cursos, eventos, materiais e avisos do banco. Não pode ser desfeito.')) return
    await clearAllContent()
    setMsg('Conteúdo removido.')
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle title="Configurações" description="Identidade da plataforma e gestão dos dados." />

      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Identidade</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome da plataforma" value={data.settings.platformName} onChange={(v) => updateSettings({ platformName: v })} />
          <Field label="Descrição / assinatura" value={data.settings.tagline} onChange={(v) => updateSettings({ tagline: v })} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Save size={13} /> As alterações são salvas automaticamente no banco.</p>
      </div>

      <div className="card mt-5 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Backup</h3>
        <p className="mt-1 text-sm text-muted">Baixe um arquivo JSON com todo o conteúdo cadastrado (cursos, calendário, biblioteca e avisos).</p>
        <button onClick={handleExport} className="mt-4 flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"><Download size={16} /> Exportar dados (JSON)</button>
        {msg && <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{msg}</p>}
      </div>

      <div className="card mt-5 border-rose-500/30 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-rose-500">Zona de risco</h3>
        <p className="mt-1 text-sm text-muted">Apaga todo o conteúdo cadastrado no banco. As categorias e configurações são mantidas.</p>
        <button onClick={handleClear} className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><Trash2 size={16} /> Limpar conteúdo</button>
      </div>
    </div>
  )
}
