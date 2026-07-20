import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Carregando…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Loader2 size={30} className="animate-spin text-brand" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
