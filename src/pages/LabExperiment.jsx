import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, FlaskConical, Target, Database, AlertTriangle, Play, RotateCcw,
  Zap, Trophy, CheckCircle2, XCircle, Sparkles, GraduationCap, Satellite,
} from 'lucide-react'
import { experiments, evaluateGnss } from '../data/labs'

export default function LabExperiment() {
  const { id } = useParams()
  const exp = experiments.find((e) => e.id === id)

  if (!exp || exp.status === 'locked') {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <FlaskConical size={40} className="mx-auto text-muted" />
        <h1 className="mt-4 text-xl font-bold text-text">Experimento indisponível</h1>
        <Link to="/labs" className="mt-4 inline-block text-brand hover:underline">Voltar ao GeoSense Labs</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1100px]">
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

      {/* briefing */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Brief icon={Target} title="Objetivo" text={exp.objective} accent />
        <Brief icon={Database} title="Cenário" text={exp.scenario} />
        <Brief icon={AlertTriangle} title="Dados disponíveis" text={exp.dataHint} />
      </div>

      <div className="mt-6">
        {exp.type === 'params' ? <ParamsLab exp={exp} /> : <ClassifyLab exp={exp} />}
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

/* ── Experimento por parâmetros (sliders / selects) ─────────────────────── */
function ParamsLab({ exp }) {
  const init = useMemo(() => {
    const o = {}
    exp.controls.forEach((c) => (o[c.key] = c.default))
    return o
  }, [exp])
  const [params, setParams] = useState(init)
  const [result, setResult] = useState(null)

  const metrics = exp.compute(params)
  const proMetrics = exp.compute(exp.pro.params)

  const run = () => setResult(exp.evaluate(params, metrics))
  const reset = () => { setParams(init); setResult(null) }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* controles */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text">
          <Sparkles size={19} className="text-brand" /> Suas decisões técnicas
        </h2>
        <p className="mt-1 text-sm text-muted">Ajuste os parâmetros e veja o impacto em tempo real.</p>

        <div className="mt-5 flex flex-col gap-5">
          {exp.controls.map((c) => (
            <Control key={c.key} c={c} value={params[c.key]} onChange={(v) => { setParams((p) => ({ ...p, [c.key]: v })); setResult(null) }} />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={run} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-strong">
            <Play size={17} /> Avaliar resultado
          </button>
          <button onClick={reset} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted hover:bg-surface-2">
            <RotateCcw size={16} /> Reiniciar
          </button>
        </div>
      </div>

      {/* métricas ao vivo */}
      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Resultado em tempo real</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {exp.metricsDisplay.map((m) => (
              <div key={m.key} className="rounded-xl bg-surface-2 p-3">
                <p className="text-xs text-muted">{m.label}</p>
                <p className="mt-0.5 text-xl font-extrabold text-text">
                  {m.fmt(metrics[m.key])} <span className="text-xs font-medium text-muted">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {result && <ResultPanel result={result} exp={exp} metrics={metrics} proMetrics={proMetrics} />}
      </div>
    </div>
  )
}

function Control({ c, value, onChange }) {
  if (c.type === 'select') {
    return (
      <div>
        <label className="flex items-center justify-between text-sm font-semibold text-text">
          {c.label}
        </label>
        <select
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            const opt = c.options.find((o) => String(o.value) === raw)
            onChange(opt ? opt.value : raw)
          }}
          className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand"
        >
          {c.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {c.help && <p className="mt-1.5 text-xs text-muted">{c.help}</p>}
      </div>
    )
  }
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-semibold text-text">
        {c.label}
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-sm font-bold text-brand">{value}{c.unit}</span>
      </label>
      <input
        type="range"
        min={c.min}
        max={c.max}
        step={c.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2.5 w-full accent-[var(--brand)]"
      />
      {c.help && <p className="mt-1.5 text-xs text-muted">{c.help}</p>}
    </div>
  )
}

/* ── Experimento de classificação (GNSS) ────────────────────────────────── */
function ClassifyLab({ exp }) {
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)

  const toggle = (pid) => {
    setResult(null)
    setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]))
  }
  const run = () => setResult(evaluateGnss(exp, selected))
  const reset = () => { setSelected([]); setResult(null) }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text">
          <Satellite size={19} className="text-brand" /> Relatório de rastreio GNSS
        </h2>
        <p className="mt-1 text-sm text-muted">Marque os pontos que você vai <strong>rejeitar</strong>.</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2.5 text-left">Ponto</th>
                <th className="px-3 py-2.5 text-right">PDOP</th>
                <th className="px-3 py-2.5 text-right">Satélites</th>
                <th className="px-3 py-2.5 text-right">σ (m)</th>
                <th className="px-3 py-2.5 text-center">Rejeitar</th>
              </tr>
            </thead>
            <tbody>
              {exp.points.map((p) => {
                const on = selected.includes(p.id)
                return (
                  <tr key={p.id} className={`border-t border-border ${on ? 'bg-brand-soft' : ''}`}>
                    <td className="px-3 py-2.5 font-semibold text-text">{p.id}</td>
                    <td className={`px-3 py-2.5 text-right ${p.pdop > 5 ? 'font-bold text-rose-500' : 'text-text'}`}>{p.pdop.toFixed(1)}</td>
                    <td className={`px-3 py-2.5 text-right ${p.sats < 6 ? 'font-bold text-rose-500' : 'text-text'}`}>{p.sats}</td>
                    <td className={`px-3 py-2.5 text-right ${p.sigma > 0.1 ? 'font-bold text-rose-500' : 'text-text'}`}>{p.sigma.toFixed(3)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[var(--brand)]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={run} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-strong">
            <Play size={17} /> Avaliar decisão
          </button>
          <button onClick={reset} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted hover:bg-surface-2">
            <RotateCcw size={16} /> Reiniciar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Seleção atual</h3>
          <p className="mt-2 text-sm text-muted">
            {selected.length === 0 ? 'Nenhum ponto marcado para rejeição.' : (
              <>Rejeitando: <span className="font-semibold text-text">{selected.join(', ')}</span></>
            )}
          </p>
        </div>
        {result && <ResultPanel result={result} exp={exp} />}
      </div>
    </div>
  )
}

/* ── Painel de resultado + comparação com o especialista ────────────────── */
function ResultPanel({ result, exp, metrics, proMetrics }) {
  const { score, criteria } = result
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0
  const xpEarned = Math.round((exp.xp * score) / 100)
  const verdict = score >= 90 ? 'Nível especialista!' : score >= 70 ? 'Muito bom!' : score >= 50 ? 'No caminho certo' : 'Vamos revisar'

  return (
    <div className="card overflow-hidden animate-fade-up">
      <div className="bg-gradient-to-br from-brand to-brand-strong p-5 text-white">
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

      <div className="p-5">
        <h4 className="text-sm font-bold uppercase tracking-wide text-muted">Análise técnica</h4>
        <ul className="mt-3 flex flex-col gap-2.5">
          {criteria.map((c, i) => (
            <li key={i} className="flex gap-2.5">
              {c.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />}
              <div>
                <p className="text-sm font-semibold text-text">{c.label}</p>
                <p className="text-xs text-muted">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* comparação com o especialista */}
        <div className="mt-5 rounded-xl border border-brand/30 bg-brand-soft p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-text">
            <GraduationCap size={18} className="text-brand" /> Como o especialista resolveu
          </div>
          {metrics && proMetrics && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-surface p-2.5">
                <p className="text-muted">Seu resultado</p>
                {exp.metricsDisplay.map((m) => (
                  <p key={m.key} className="font-semibold text-text">{m.label}: {m.fmt(metrics[m.key])} {m.unit}</p>
                ))}
              </div>
              <div className="rounded-lg bg-surface p-2.5 ring-1 ring-brand/30">
                <p className="text-brand">Especialista</p>
                {exp.metricsDisplay.map((m) => (
                  <p key={m.key} className="font-semibold text-text">{m.label}: {m.fmt(proMetrics[m.key])} {m.unit}</p>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-sm leading-relaxed text-muted">{exp.pro.note}</p>
        </div>
      </div>
    </div>
  )
}
