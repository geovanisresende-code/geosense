import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical, Plane, Satellite, Layers, Image, Mountain, Briefcase, Rocket,
  Trophy, Flame, Zap, ArrowRight, Clock, CheckCircle2, Target,
} from 'lucide-react'
import { experiments } from '../data/labs'
import { getProgress } from './labs/progressStore'

const iconMap = { drone: Plane, satellite: Satellite, layers: Layers, image: Image, mountain: Mountain, briefcase: Briefcase, drone3d: Rocket }

const diffColor = {
  Iniciante: 'text-emerald-500 bg-emerald-500/10',
  Intermediário: 'text-amber-500 bg-amber-500/10',
  Avançado: 'text-rose-500 bg-rose-500/10',
  Especialista: 'text-violet-500 bg-violet-500/10',
}

export default function Labs() {
  const [progress, setProgress] = useState(getProgress())
  useEffect(() => { setProgress(getProgress()) }, [])

  const pct = Math.round((progress.xp / progress.xpToNext) * 100)

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2236] to-[#08121d] p-7 text-white sm:p-9">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong shadow-lg shadow-brand/30">
            <FlaskConical size={32} />
          </span>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold sm:text-4xl">GeoSense Labs</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Um laboratório virtual de geotecnologias. Aqui você <strong>aprende fazendo</strong>: cada
              experimento é um minijogo que simula uma decisão técnica real de campo.
            </p>
          </div>
        </div>

        <div className="relative mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><Trophy size={17} className="text-brand" /> Nível {progress.level}</span>
              <span className="text-xs text-white/60">{progress.levelLabel}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-white/60">{progress.xp} / {progress.xpToNext} XP</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <div>
              <p className="text-xs text-white/60">Experimentos concluídos</p>
              <p className="text-lg font-bold">{progress.completedCount} de {experiments.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <Flame size={24} className="text-brand" />
            <div>
              <p className="text-xs text-white/60">Sequência de estudo</p>
              <p className="text-lg font-bold">{progress.streak} {progress.streak === 1 ? 'dia' : 'dias'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <Target size={20} className="text-brand" />
        <h2 className="text-xl font-bold text-text">Trilha de Experimentos</h2>
        <span className="text-sm text-muted">— da curiosidade à prática avançada</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {experiments.map((exp) => {
          const Icon = iconMap[exp.icon] || FlaskConical
          const bestScore = progress.completed[exp.id]
          const done = bestScore !== undefined
          return (
            <Link
              key={exp.id}
              to={`/labs/${exp.id}`}
              className="card group relative flex flex-col p-5 animate-fade-up cursor-pointer transition-all hover:-translate-y-0.5 hover:border-brand/40"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wide text-muted">EXPERIMENTO {String(exp.number).padStart(2, '0')}</span>
                    {done && <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success"><CheckCircle2 size={11} /> {bestScore}/100</span>}
                  </div>
                  <h3 className="mt-0.5 text-base font-bold leading-snug text-text">{exp.title}</h3>
                  <p className="text-xs text-muted">{exp.category}</p>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{exp.objective}</p>

              <div className="mt-auto flex items-center gap-2 pt-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${diffColor[exp.difficulty]}`}>{exp.difficulty}</span>
                <span className="flex items-center gap-1 text-xs text-muted"><Clock size={13} /> {exp.duration}</span>
                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-brand"><Zap size={14} /> {exp.xp} XP</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all group-hover:gap-3">
                {done ? 'Jogar novamente' : 'Iniciar experimento'} <ArrowRight size={16} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
