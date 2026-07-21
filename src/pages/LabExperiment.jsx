import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, FlaskConical, Target, Database, Gamepad2, Zap, Trophy, RotateCcw, Sparkles,
} from 'lucide-react'
import { experiments } from '../data/labs'
import { GAME_COMPONENTS } from './labs/games'
import { recordResult } from './labs/progressStore'

export default function LabExperiment() {
  const { id } = useParams()
  const exp = experiments.find((e) => e.id === id)
  const Game = exp ? GAME_COMPONENTS[exp.id] : null
  const [runId, setRunId] = useState(0)
  const [result, setResult] = useState(null)

  if (!exp || !Game) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <FlaskConical size={40} className="mx-auto text-muted" />
        <h1 className="mt-4 text-xl font-bold text-text">Experimento indisponível</h1>
        <Link to="/labs" className="mt-4 inline-block text-brand hover:underline">Voltar ao GeoSense Labs</Link>
      </div>
    )
  }

  function handleComplete(score, stats) {
    const xpEarned = Math.round((exp.xp * score) / 100)
    recordResult(exp.id, score, xpEarned)
    setResult({ score, stats, xpEarned })
  }

  function playAgain() {
    setResult(null)
    setRunId((r) => r + 1)
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link to="/labs" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft size={18} /> Voltar ao GeoSense Labs
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
          <FlaskConical size={26} />
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-muted">
            EXPERIMENTO {String(exp.number).padStart(2, '0')} · {exp.category}
          </p>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">{exp.title}</h1>
        </div>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-sm font-bold text-brand sm:flex">
          <Zap size={15} /> {exp.xp} XP
        </span>
      </div>

      {!result && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Brief icon={Target} title="Objetivo" text={exp.objective} accent />
          <Brief icon={Database} title="Cenário" text={exp.scenario} />
          <Brief icon={Gamepad2} title="Como jogar" text={exp.dataHint} />
        </div>
      )}

      <div className="mt-6">
        {!result ? (
          <div className="card p-5">
            <Game key={runId} onComplete={handleComplete} />
          </div>
        ) : (
          <ResultView exp={exp} result={result} onReplay={playAgain} />
        )}
      </div>
    </div>
  )
}

function Brief({ icon: Icon, title, text, accent }) {
  return (
    <div className={`card p-4 ${accent ? 'ring-1 ring-brand/30' : ''}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <Icon size={17} className="text-brand" /> {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

const STAT_LABELS = {
  coveragePct: 'Cobertura', batteryPct: 'Bateria restante', timeSec: 'Tempo',
  hits: 'Acertos', misses: 'Perdidos', wrong: 'Erros',
  correct: 'Filtrados certo', overcut: 'Solo removido por engano', residual: 'Vegetação restante', preserved: 'Solo preservado',
  solved: 'Resolvido', moves: 'Movimentos', correctCount: 'Peças corretas', total: 'Total de peças',
  guess: 'Seu palpite', real: 'Volume real', diffPct: 'Diferença',
}

function formatStat(key, value) {
  if (key === 'solved') return value ? 'Sim' : 'Não'
  if (key.toLowerCase().includes('pct')) return `${value}%`
  if (key === 'timeSec') return `${value}s`
  if (key === 'guess' || key === 'real') return `${value} m³`
  return value
}

function ResultView({ exp, result, onReplay }) {
  const { score, xpEarned, stats } = result
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0
  const verdict = score >= 90 ? 'Nível especialista!' : score >= 70 ? 'Muito bom!' : score >= 50 ? 'No caminho certo' : 'Vamos tentar de novo?'
  const isFinale = Array.isArray(stats?.stageScores)

  return (
    <div className="card overflow-hidden animate-fade-up">
      <div className="bg-gradient-to-br from-brand to-brand-strong p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{verdict}</span>
          <span className="flex items-center gap-1 text-sm font-bold"><Zap size={15} /> +{xpEarned} XP</span>
        </div>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-5xl font-extrabold">{score}</span>
          <span className="mb-1.5 text-lg font-semibold text-white/80">/ 100</span>
          <div className="mb-1.5 ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <Trophy key={i} size={22} className={i < stars ? 'text-white' : 'text-white/30'} fill={i < stars ? 'currentColor' : 'none'} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isFinale ? (
          <div className="mb-5 flex flex-col gap-2">
            <h4 className="text-sm font-bold uppercase tracking-wide text-muted">Desempenho por etapa</h4>
            {stats.stages.map((label, i) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-text">{i + 1}. {label}</span>
                <span className="font-bold text-brand">{stats.stageScores[i]}/100</span>
              </div>
            ))}
          </div>
        ) : stats && Object.keys(stats).length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {Object.entries(stats).map(([k, v]) => (
              <span key={k} className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-text">
                {STAT_LABELS[k] || k}: <strong className="text-brand">{formatStat(k, v)}</strong>
              </span>
            ))}
          </div>
        ) : null}

        <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-text">
            <Sparkles size={17} className="text-brand" /> Como isso funciona na prática
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{exp.expertNote}</p>
        </div>

        <button onClick={onReplay} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong">
          <RotateCcw size={16} /> Jogar novamente
        </button>
      </div>
    </div>
  )
}
