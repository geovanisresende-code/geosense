import { useEffect, useRef, useState } from 'react'
import { useGameLoop, randInt, drawHud } from '../gameUtils'

const CELL = 42

// "Cobertura Aérea" — pilote o drone (setas / WASD) e cubra o talhão
// inteiro antes que a bateria acabe, desviando das árvores.
export default function FlightCoverageGame({ cols = 16, rows = 9, onComplete }) {
  const canvasRef = useRef(null)
  const [done, setDone] = useState(false)
  const W = cols * CELL
  const H = rows * CELL

  const state = useRef(null)
  if (!state.current) {
    const obstacles = new Set()
    const total = cols * rows
    const nObstacles = Math.round(total * 0.12)
    while (obstacles.size < nObstacles) {
      const c = randInt(2, cols - 1)
      const r = randInt(1, rows - 2)
      if (c === 0 && r === Math.floor(rows / 2)) continue
      obstacles.add(`${c},${r}`)
    }
    const visited = new Set(['0,' + Math.floor(rows / 2)])
    state.current = {
      pos: { c: 0, r: Math.floor(rows / 2) },
      dir: null,
      pendingDir: null,
      obstacles,
      visited,
      battery: 100,
      tickAcc: 0,
      elapsed: 0,
      bumpFlash: 0,
      finished: false,
    }
  }

  useEffect(() => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }
    const held = new Set()
    function onDown(e) {
      const d = keyMap[e.key]
      if (!d) return
      e.preventDefault()
      held.add(d)
      state.current.pendingDir = d
    }
    function onUp(e) {
      const d = keyMap[e.key]
      if (!d) return
      held.delete(d)
      if (state.current.pendingDir === d) {
        state.current.pendingDir = [...held].pop() || null
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  const traversable = cols * rows - state.current.obstacles.size

  useGameLoop((dt) => {
    const s = state.current
    if (s.finished) return
    s.elapsed += dt
    s.tickAcc += dt
    s.battery = Math.max(0, s.battery - dt * 1.15)
    if (s.bumpFlash > 0) s.bumpFlash -= dt

    const TICK = 0.14
    if (s.tickAcc >= TICK) {
      s.tickAcc -= TICK
      const d = s.pendingDir
      if (d) {
        let { c, r } = s.pos
        if (d === 'up') r--
        else if (d === 'down') r++
        else if (d === 'left') c--
        else if (d === 'right') c++
        const inBounds = c >= 0 && c < cols && r >= 0 && r < rows
        const blocked = inBounds && s.obstacles.has(`${c},${r}`)
        if (inBounds && !blocked) {
          s.pos = { c, r }
          s.visited.add(`${c},${r}`)
        } else {
          s.battery = Math.max(0, s.battery - 3)
          s.bumpFlash = 0.15
        }
      }
    }

    const coveragePct = (s.visited.size / traversable) * 100
    if (!s.finished && (s.battery <= 0 || coveragePct >= 100)) {
      s.finished = true
      const battPct = s.battery
      const score = Math.round(clampScore(coveragePct * 0.85 + battPct * 0.15))
      setTimeout(() => {
        setDone(true)
        onComplete(score, { coveragePct: Math.round(coveragePct), batteryPct: Math.round(battPct), timeSec: Math.round(s.elapsed) })
      }, 260)
    }

    render()
  }, !done)

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#0d2236'
    ctx.fillRect(0, 0, W, H)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const key = `${c},${r}`
        const x = c * CELL, y = r * CELL
        if (s.obstacles.has(key)) {
          ctx.fillStyle = '#173047'
          ctx.fillRect(x, y, CELL, CELL)
          ctx.beginPath()
          ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = '#1f8a4c'
          ctx.fill()
        } else if (s.visited.has(key)) {
          ctx.fillStyle = 'rgba(249,115,22,0.22)'
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)'
          ctx.strokeRect(x, y, CELL, CELL)
        }
      }
    }

    const dx = s.pos.c * CELL + CELL / 2
    const dy = s.pos.r * CELL + CELL / 2
    ctx.save()
    ctx.translate(dx, dy)
    const angle = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[s.pendingDir || 'right']
    ctx.rotate(angle)
    ctx.fillStyle = s.bumpFlash > 0 ? '#ef4444' : '#f97316'
    ctx.beginPath()
    ctx.moveTo(14, 0); ctx.lineTo(-10, 9); ctx.lineTo(-10, -9)
    ctx.closePath(); ctx.fill()
    ctx.restore()

    const coveragePct = (s.visited.size / traversable) * 100
    drawHud(ctx, W, {
      left: `Cobertura ${coveragePct.toFixed(0)}%`,
      center: `⏱ ${s.elapsed.toFixed(0)}s`,
      right: `🔋 ${Math.max(0, s.battery).toFixed(0)}%`,
    })
    ctx.fillStyle = 'rgba(15,34,54,0.55)'
    ctx.fillRect(0, H - 22, W, 22)
    ctx.fillStyle = s.battery > 25 ? '#f97316' : '#ef4444'
    ctx.fillRect(2, H - 20, (W - 4) * (Math.max(0, s.battery) / 100), 18)
  }

  useEffect(() => { render() }, [])

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-border" style={{ imageRendering: 'pixelated', aspectRatio: `${W}/${H}` }} tabIndex={0} />
      <p className="mt-3 text-center text-sm text-muted">Use as setas ou <strong>WASD</strong> para pilotar o drone. Cubra o campo antes que a bateria acabe.</p>
    </div>
  )
}

function clampScore(v) { return Math.max(0, Math.min(100, v)) }
