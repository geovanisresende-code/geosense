import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Save } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Field, SectionTitle } from './ui'

export default function AdminSettings() {
  const { data, updateSettings, importData, resetData } = useData()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `geosense-dados-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        importData(obj)
        setMsg('Dados importados com sucesso.')
      } catch {
        setMsg('Arquivo inválido. Selecione um JSON exportado por esta plataforma.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
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
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Save size={13} /> As alterações são salvas automaticamente.</p>
      </div>

      <div className="card mt-5 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Backup e transferência</h3>
        <p className="mt-1 text-sm text-muted">Exporte todo o conteúdo em um arquivo, ou importe um backup. Útil para entregar ao cliente ou migrar para o servidor.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"><Download size={16} /> Exportar dados (JSON)</button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"><Upload size={16} /> Importar dados</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        {msg && <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{msg}</p>}
      </div>

      <div className="card mt-5 border-rose-500/30 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-rose-500">Zona de risco</h3>
        <p className="mt-1 text-sm text-muted">Apaga todo o conteúdo cadastrado e volta ao estado inicial. Não pode ser desfeito.</p>
        <button
          onClick={() => { if (confirm('Tem certeza? Isso apaga todos os cursos, eventos e materiais cadastrados.')) { resetData(); setMsg('Dados redefinidos.') } }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
        >
          <RotateCcw size={16} /> Limpar tudo
        </button>
      </div>
    </div>
  )
}
