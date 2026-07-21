import { useEffect, useRef, useState } from 'react'
import { useGameLoop, rand, randInt, dist, canvasPoint, drawHud } from '../gameUtils'

const W = 720, H = 420

// "Travar Satélites" — clique nos satélites bons (verdes) antes que somam.
// Evite os ruins (vermelhos, com jitter = multicaminho/geometria fraca).
export default function SatelliteLockGame({ duration = 40, onComplete }) {
  const canvasRef = useRef(null)
  const [done, setDone] = useState(false)
  const nextId = useRef(1)

  const state = useRef({
    sats: [],
    spawnAcc: 0,
    timeLeft: duration,
    score: 0,
    combo: 0,
    hits: 0,
    misses: 0,
    wrong: 0,
    flash: 0,
    popups: [],
    stars: Array.from({ length: 60 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.6) })),
  })

  useGameLoop((dt) => {
    const s = state.current
    if (done) return
    s.timeLeft -= dt
    if (s.flash > 0) s.flash -= dt
    s.spawnAcc += dt
    const spawnEvery = 0.75
    if (s.spawnAcc >= spawnEvery && s.sats.length < 6) {
      s.spawnAcc = 0
      const bad = Math.random() < 0.32
      s.sats.push({
        id: nextId.current++,
        x: rand(60, W - 60), y: rand(50, H - 60),
        bad, ttl: bad ? rand(2.2, 3) : rand(1.8, 2.6),
        age: 0, jitterX: 0, jitterY: 0,
      })
    }
    s.sats.forEach((sat) => {
      sat.age += dt
      if (sat.bad) { sat.jitterX = rand(-3, 3); sat.jitterY = rand(-3, 3) }
    })
    s.sats = s.sats.filter((sat) => sat.age < sat.ttl)
    s.popups.forEach((p) => { p.y -= dt * 40; p.life -= dt })
    s.popups = s.popups.filter((p) => p.life > 0)

    if (s.timeLeft <= 0 && !done) {
      const finalScore = Math.round(Math.max(0, Math.min(100, (s.score / 260) * 100)))
      setTimeout(() => {
        setDone(true)
        onComplete(finalScore, { hits: s.hits, misses: s.misses, wrong: s.wrong })
      }, 200)
    }
    render()
  }, !done)

  function handleClick(e) {
    const s = state.current
    if (done) return
    const { x, y } = canvasPoint(canvasRef.current, e)
    let target = null, best = 26
    for (const sat of s.sats) {
      const d = dist(x, y, sat.x + sat.jitterX, sat.y + sat.jitterY)
      if (d < best) { best = d; target = sat }
    }
    if (!target) return
    s.sats = s.sats.filter((sat) => sat !== target)
    if (target.bad) {
      s.wrong++; s.combo = 0; s.flash = 0.25
      s.score = Math.max(0, s.score - 15)
      s.popups.push({ x: target.x, y: target.y, text: '-15', color: '#ef4444', life: 0.8 })
    } else {
      s.hits++
      s.combo++
      const mult = Math.min(3, 1 + s.combo * 0.15)
      const gain = Math.round(10 * mult)
      s.score += gain
      s.popups.push({ x: target.x, y: target.y, text: `+${gain}`, color: '#22c55e', life: 0.8 })
    }
  }

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#08121d'); grad.addColorStop(1, '#0d2236')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    s.stars.forEach((st) => { ctx.globalAlpha = 0.3 + 0.4 * Math.sin(performance.now() / 500 + st.x); ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill() })
    ctx.globalAlpha = 1

    s.sats.forEach((sat) => {
      const x = sat.x + sat.jitterX, y = sat.y + sat.jitterY
      const pulse = 1 + 0.15 * Math.sin(sat.age * (sat.bad ? 14 : 6))
      ctx.beginPath()
      ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2)
      ctx.fillStyle = sat.bad ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 13, 0, Math.PI * 2)
      ctx.fillStyle = sat.bad ? '#ef4444' : '#22c55e'
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(sat.bad ? '!' : '✓', x, y + 1)
      const remain = 1 - sat.age / sat.ttl
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(x, y, 18, -Math.PI / 2, -Math.PI / 2 + remain * Math.PI * 2); ctx.stroke()
    })

    s.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x, p.y)
      ctx.globalAlpha = 1
    })

    if (s.flash > 0) { ctx.fillStyle = `rgba(239,68,68,${s.flash * 0.5})`; ctx.fillRect(0, 0, W, H) }

    drawHud(ctx, W, {
      left: `Placar ${s.score}`,
      center: `⏱ ${Math.max(0, s.timeLeft).toFixed(0)}s`,
      right: `Combo x${(1 + s.combo * 0.15).toFixed(1).replace('.0', '')}`,
    })
  }

  useEffect(() => { render() }, [])

  return (
    <div>
      <canvas
        ref={canvasRef} width={W} height={H}
        className="w-full cursor-crosshair rounded-xl border border-border"
        style={{ aspectRatio: `${W}/${H}` }}
        onClick={handleClick}
      />
      <p className="mt-3 text-center text-sm text-muted">
        Clique nos satélites <strong className="text-success">verdes</strong> antes que somam. Evite os <strong className="text-rose-500">vermelhos</strong> (geometria fraca / multicaminho).
      </p>
    </div>
  )
}
