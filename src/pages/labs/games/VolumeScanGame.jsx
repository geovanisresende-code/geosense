import { useEffect, useMemo, useRef, useState } from 'react'
import { Radar, Check } from 'lucide-react'
import { rand, useGameLoop, drawHud } from '../gameUtils'

const W = 720, H = 380
const BASE_Y = H - 50
const PX_PER_M = 12 // escala horizontal: 12 px = 1 m
const PY_PER_M = 22 // escala vertical: 22 px = 1 m
const WIDTH_M = W / PX_PER_M
const PILE_LENGTH_M = 28 // comprimento assumido da pilha (perpendicular à tela)

function buildProfile() {
  const a1 = rand(2.2, 3.4), a2 = rand(0.6, 1.2), a3 = rand(0.3, 0.7)
  const p1 = rand(0.9, 1.3), p2 = rand(2, 3.4), phase = rand(0, Math.PI)
  const center = WIDTH_M / 2 + rand(-3, 3)
  const spread = rand(7, 10)
  return (xMeters) => {
    const t = (xMeters - center) / spread
    const envelope = Math.max(0, 1 - t * t)
    const noise = a2 * Math.sin(xMeters * p1 + phase) * 0.3 + a3 * Math.sin(xMeters * p2)
    return Math.max(0, envelope * (a1 + noise) * 2.1)
  }
}

// "Escaneie a Pilha" — a varredura revela o perfil da pilha; depois você
// aposta o volume (m³) antes do tempo acabar.
export default function VolumeScanGame({ decisionTime = 20, onComplete }) {
  const canvasRef = useRef(null)
  const profile = useMemo(buildProfile, [])
  const [phase, setPhase] = useState('scanning') // scanning | guessing | done
  const [scanX, setScanX] = useState(0)
  const [guess, setGuess] = useState(500)
  const [timeLeft, setTimeLeft] = useState(decisionTime)
  const doneRef = useRef(false)

  const realVolume = useMemo(() => {
    let area = 0
    const step = 0.2
    for (let x = 0; x < WIDTH_M; x += step) area += profile(x) * step
    return Math.round(area * PILE_LENGTH_M)
  }, [profile])

  useGameLoop((dt) => {
    if (phase === 'scanning') {
      setScanX((x) => {
        const next = x + dt * (W / 2.6)
        if (next >= W) { setPhase('guessing'); return W }
        return next
      })
    } else if (phase === 'guessing') {
      setTimeLeft((t) => {
        const next = t - dt
        if (next <= 0 && !doneRef.current) { finish(); return 0 }
        return next
      })
    }
    render()
  }, phase !== 'done')

  function finish(finalGuess) {
    if (doneRef.current) return
    doneRef.current = true
    const g = finalGuess ?? guess
    const diffPct = Math.abs(g - realVolume) / realVolume
    const score = Math.round(Math.max(0, Math.min(100, 100 - diffPct * 260)))
    setPhase('done')
    setTimeout(() => onComplete(score, { guess: g, real: realVolume, diffPct: Math.round(diffPct * 100) }), 300)
  }

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0e2032'); sky.addColorStop(1, '#16304a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // grade de escala (metros)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.font = '10px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    for (let m = 0; m <= WIDTH_M; m += 5) {
      const x = m * PX_PER_M
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, BASE_Y); ctx.stroke()
      ctx.fillText(`${m}m`, x + 2, BASE_Y + 14)
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.beginPath(); ctx.moveTo(0, BASE_Y); ctx.lineTo(W, BASE_Y); ctx.stroke()

    // silhueta da pilha revelada até scanX
    const revealX = phase === 'scanning' ? scanX : W
    ctx.beginPath()
    ctx.moveTo(0, BASE_Y)
    const stepPx = 4
    for (let x = 0; x <= revealX; x += stepPx) {
      const xm = x / PX_PER_M
      const h = profile(xm) * PY_PER_M
      ctx.lineTo(x, BASE_Y - h)
    }
    ctx.lineTo(Math.min(revealX, W), BASE_Y)
    ctx.closePath()
    const pileGrad = ctx.createLinearGradient(0, BASE_Y - 90, 0, BASE_Y)
    pileGrad.addColorStop(0, '#9a7b52'); pileGrad.addColorStop(1, '#6b5537')
    ctx.fillStyle = pileGrad
    ctx.fill()

    if (phase === 'scanning') {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(scanX, 34); ctx.lineTo(scanX, BASE_Y); ctx.stroke()
      ctx.fillStyle = 'rgba(34,211,238,0.15)'
      ctx.fillRect(scanX - 8, 34, 16, BASE_Y - 34)
    }

    drawHud(ctx, W, {
      left: 'Varredura LiDAR',
      center: phase === 'scanning' ? 'Escaneando…' : `Decida em ${Math.max(0, timeLeft).toFixed(0)}s`,
      right: `Comprimento: ${PILE_LENGTH_M} m`,
    })
  }

  useEffect(() => { render() }, [])

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-border" style={{ aspectRatio: `${W}/${H}` }} />
      {phase === 'guessing' && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-text"><Radar size={16} className="text-brand" /> Qual o volume desta pilha?</p>
          <div className="flex w-full max-w-md items-center gap-3">
            <input type="range" min={50} max={3000} step={10} value={guess} onChange={(e) => setGuess(Number(e.target.value))} className="w-full accent-[var(--brand)]" />
            <span className="w-24 shrink-0 rounded-lg bg-brand-soft px-2 py-1 text-center text-sm font-bold text-brand">{guess} m³</span>
          </div>
          <button onClick={() => finish(guess)} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
            <Check size={16} /> Confirmar palpite
          </button>
        </div>
      )}
      {phase === 'scanning' && <p className="mt-3 text-center text-sm text-muted">O laser está mapeando o perfil da pilha…</p>}
    </div>
  )
}
