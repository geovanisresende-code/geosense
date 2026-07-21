import { useEffect, useRef, useState } from 'react'
import { useGameLoop, rand, dist, canvasPoint, drawHud } from '../gameUtils'

const W = 720, H = 440
const GROUND_Y = H - 46

// "Filtragem em Queda" — clique nos pontos de vegetação (verdes) antes que
// caiam no chão. NÃO clique nos pontos de solo (marrons) — deixe-os pousar.
export default function PointCloudSortGame({ duration = 45, onComplete }) {
  const canvasRef = useRef(null)
  const [done, setDone] = useState(false)
  const nextId = useRef(1)

  const state = useRef({
    points: [], spawnAcc: 0, timeLeft: duration, score: 0,
    correct: 0, overcut: 0, residual: 0, preserved: 0, popups: [], flashGood: 0, flashBad: 0,
  })

  useGameLoop((dt) => {
    const s = state.current
    if (done) return
    s.timeLeft -= dt
    if (s.flashGood > 0) s.flashGood -= dt
    if (s.flashBad > 0) s.flashBad -= dt
    s.spawnAcc += dt
    const progress = 1 - Math.max(0, s.timeLeft) / duration
    const spawnEvery = Math.max(0.32, 0.75 - progress * 0.45)
    if (s.spawnAcc >= spawnEvery) {
      s.spawnAcc = 0
      const noise = Math.random() < 0.55
      s.points.push({
        id: nextId.current++, x: rand(30, W - 30), y: -10,
        vy: rand(70, 100) + progress * 60, noise, r: 11,
      })
    }
    s.points.forEach((p) => { p.y += p.vy * dt })
    s.points.forEach((p) => {
      if (p.y >= GROUND_Y && !p.landed) {
        p.landed = true
        if (p.noise) { s.residual++; s.score = Math.max(0, s.score - 8) }
        else { s.preserved++; s.score += 4 }
      }
    })
    s.points = s.points.filter((p) => !p.landed)
    s.popups.forEach((p) => { p.y -= dt * 30; p.life -= dt })
    s.popups = s.popups.filter((p) => p.life > 0)

    if (s.timeLeft <= 0 && !done) {
      const finalScore = Math.round(Math.max(0, Math.min(100, (s.score / 260) * 100)))
      setTimeout(() => {
        setDone(true)
        onComplete(finalScore, { correct: s.correct, overcut: s.overcut, residual: s.residual, preserved: s.preserved })
      }, 200)
    }
    render()
  }, !done)

  function handleClick(e) {
    const s = state.current
    if (done) return
    const { x, y } = canvasPoint(canvasRef.current, e)
    let target = null, best = 24
    for (const p of s.points) {
      const d = dist(x, y, p.x, p.y)
      if (d < best) { best = d; target = p }
    }
    if (!target) return
    s.points = s.points.filter((p) => p !== target)
    if (target.noise) {
      s.correct++; s.score += 10; s.flashGood = 0.15
      s.popups.push({ x: target.x, y: target.y, text: '+10', color: '#22c55e', life: 0.7 })
    } else {
      s.overcut++; s.score = Math.max(0, s.score - 15); s.flashBad = 0.2
      s.popups.push({ x: target.x, y: target.y, text: '-15', color: '#ef4444', life: 0.7 })
    }
  }

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0e2032'); sky.addColorStop(1, '#16304a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#12314a'
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke()

    s.points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.noise ? '#22c55e' : '#a3703b'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.stroke()
    })

    s.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.font = 'bold 15px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x, p.y)
      ctx.globalAlpha = 1
    })

    if (s.flashBad > 0) { ctx.fillStyle = `rgba(239,68,68,${s.flashBad * 0.4})`; ctx.fillRect(0, 0, W, H) }
    if (s.flashGood > 0) { ctx.fillStyle = `rgba(34,197,94,${s.flashGood * 0.25})`; ctx.fillRect(0, 0, W, H) }

    drawHud(ctx, W, {
      left: `Placar ${s.score}`,
      center: `⏱ ${Math.max(0, s.timeLeft).toFixed(0)}s`,
      right: `Filtrados ${s.correct}`,
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
        Clique nos pontos <strong className="text-success">verdes</strong> (vegetação) antes que caiam. Deixe os <strong style={{ color: '#a3703b' }}>marrons</strong> (solo) pousarem intactos.
      </p>
    </div>
  )
}
