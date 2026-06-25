import { LineChart, Clock, Award, Flame } from 'lucide-react'
import { stats } from '../data/courses'

export default function ProgressFooter() {
  return (
    <div className="card mt-6 flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-text">
          <LineChart size={20} className="text-brand" />
          <span className="font-semibold">Seu Progresso Geral</span>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-brand">{stats.overall}%</span>
          <span className="text-sm text-muted">
            {stats.modulesDone} de {stats.modulesTotal} módulos concluídos
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong" style={{ width: `${stats.overall}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 lg:gap-10 lg:border-l lg:border-border lg:pl-10">
        <Stat icon={Clock} label="Tempo de Estudo" value={stats.studyTime} />
        <Stat icon={Award} label="Certificados" value={stats.certificates} />
        <Stat icon={Flame} label="Sequência" value={`${stats.streak} dias`} />
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={26} className="text-muted" strokeWidth={1.6} />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-lg font-bold text-brand">{value}</p>
      </div>
    </div>
  )
}
