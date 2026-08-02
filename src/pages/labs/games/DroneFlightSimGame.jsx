import { useEffect, useRef, useState } from 'react'
import { useGameLoop, rand, randInt, clamp, loadKeyedImage, roundRect } from '../gameUtils'
import droneSrc from '../../../assets/drone.png'

const W = 720, H = 420
const CENTER_X = W / 2
const GROUND_Y = H * 0.66
const FOCAL = 260
const Z_FAR = 1400
const COLLIDE_Z = 60
const DRONE_Z = 78

const TOTAL_GATES = 30
const TOTAL_OBST = 24
const GATE_RADIUS_WORLD = 60
const OBST_RADIUS_WORLD = 42

const ACC = 460
const MAX_SPEED = 230
const FRICTION = 3.4
const POS_LIMIT_X = 155
const POS_LIMIT_Y = 95

// Posições dos 4 motores/hélices na foto (frações da largura/altura da
// imagem original) — confirmadas por amostragem de pixel (hub bem escuro).
const PROP_HUBS = [
  { x: 0.319, y: 0.229, r: 0.145 },
  { x: 0.703, y: 0.229, r: 0.145 },
  { x: 0.212, y: 0.503, r: 0.145 },
  { x: 0.801, y: 0.503, r: 0.145 },
]

function drawSpinningProp(ctx, cx, cy, radius, angle) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  for (let b = 0; b < 3; b++) {
    ctx.rotate((Math.PI * 2) / 3)
    const grad = ctx.createLinearGradient(0, 0, radius, 0)
    grad.addColorStop(0, 'rgba(225,229,233,0.55)')
    grad.addColorStop(0.7, 'rgba(225,229,233,0.18)')
    grad.addColorStop(1, 'rgba(225,229,233,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(radius * 0.52, 0, radius * 0.52, radius * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(200,205,210,0.3)'
  ctx.fill()
  ctx.restore()
}

function project(worldX, worldY, z) {
  const scale = FOCAL / (z + FOCAL)
  return { x: CENTER_X + worldX * scale, y: GROUND_Y - worldY * scale * 0.9, scale }
}

// Silhueta de relevo no horizonte — soma de senos dá uma cordilheira suave,
// sem precisar guardar estado (é função pura de x).
function ridgeHeight(x) {
  return 10 + 9 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.031 + 1.3) + 4 * Math.sin(x * 0.007 + 2.1)
}

function drawRidge(ctx) {
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y)
  for (let x = 0; x <= W; x += 12) ctx.lineTo(x, GROUND_Y - Math.max(0, ridgeHeight(x)))
  ctx.lineTo(W, GROUND_Y)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, GROUND_Y - 40, 0, GROUND_Y)
  grad.addColorStop(0, 'rgba(12,28,42,0.9)')
  grad.addColorStop(1, 'rgba(6,16,26,1)')
  ctx.fillStyle = grad
  ctx.fill()
}

function drawTargetIcon(ctx, cx, cy, r) {
  ctx.save()
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#4ade80'
  ctx.beginPath(); ctx.arc(cx, cy, 1.4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawStarIcon(ctx, cx, cy, r) {
  ctx.save()
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2
    const a2 = a1 + Math.PI / 5
    const p1x = cx + Math.cos(a1) * r, p1y = cy + Math.sin(a1) * r
    const p2x = cx + Math.cos(a2) * r * 0.42, p2y = cy + Math.sin(a2) * r * 0.42
    if (i === 0) ctx.moveTo(p1x, p1y); else ctx.lineTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// HUD flutuante (painel translúcido + barra de progresso), exclusivo deste
// jogo — não usa o drawHud genérico para não afetar os demais experimentos.
function drawFlightHud(ctx, W, s, gatesTotal, obstTotal) {
  const barH = 38
  ctx.save()
  const grad = ctx.createLinearGradient(0, 0, 0, barH)
  grad.addColorStop(0, 'rgba(6,14,22,0.82)')
  grad.addColorStop(1, 'rgba(6,14,22,0.4)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, barH)
  ctx.fillStyle = 'rgba(249,115,22,0.55)'
  ctx.fillRect(0, barH - 2, W, 2)

  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 10px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(248,250,252,0.65)'
  ctx.fillText('MISSÃO DE CAMPO', W / 2, 11)

  ctx.font = 'bold 15px Inter, sans-serif'
  ctx.fillStyle = '#f8fafc'
  ctx.textAlign = 'left'
  drawTargetIcon(ctx, 17, barH / 2 + 3, 6.5)
  ctx.fillText(`${s.gatesHit}/${gatesTotal} GCPs`, 30, barH / 2 + 3)

  ctx.textAlign = 'right'
  const scoreText = `${s.score}`
  ctx.fillText(scoreText, W - 16, barH / 2 + 3)
  const scoreW = ctx.measureText(scoreText).width
  drawStarIcon(ctx, W - 22 - scoreW, barH / 2 + 3, 6.5)
  ctx.restore()

  const remaining = s.spawnQueue.length + s.objects.length
  const total = gatesTotal + obstTotal
  const pct = clamp((total - remaining) / total, 0, 1)
  const pad = 14, trackY = barH + 5, trackH = 4, trackW = W - pad * 2
  ctx.save()
  roundRect(ctx, pad, trackY, trackW, trackH, 2)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fill()
  if (pct > 0) {
    roundRect(ctx, pad, trackY, Math.max(trackH, trackW * pct), trackH, 2)
    const barGrad = ctx.createLinearGradient(pad, 0, pad + trackW, 0)
    barGrad.addColorStop(0, '#f97316')
    barGrad.addColorStop(1, '#fb8c3a')
    ctx.fillStyle = barGrad
    ctx.fill()
  }
  ctx.restore()
}

function drawCornerBrackets(ctx, W, H) {
  const len = 24, pad = 9
  ctx.save()
  ctx.strokeStyle = 'rgba(249,115,22,0.5)'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round';
  [[pad, pad, 1, 1], [W - pad, pad, -1, 1], [pad, H - pad, 1, -1], [W - pad, H - pad, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(x, y + len * dy)
    ctx.lineTo(x, y)
    ctx.lineTo(x + len * dx, y)
    ctx.stroke()
  })
  ctx.restore()
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(CENTER_X, H * 0.5, H * 0.35, CENTER_X, H * 0.5, H * 0.85)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.32)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawEdgeFlash(ctx, W, H, rgb, intensity) {
  if (intensity <= 0) return
  const alpha = clamp(intensity * 1.6, 0, 0.6)
  const g = ctx.createRadialGradient(CENTER_X, H * 0.55, H * 0.1, CENTER_X, H * 0.55, H)
  g.addColorStop(0, `rgba(${rgb},0)`)
  g.addColorStop(0.7, `rgba(${rgb},0)`)
  g.addColorStop(1, `rgba(${rgb},${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawGate(ctx, p, r, s, o) {
  const rr = r * (1 + Math.sin(s.elapsed * 3.4 + o.id * 13) * 0.05)
  ctx.save()
  ctx.shadowColor = 'rgba(34,197,94,0.65)'
  ctx.shadowBlur = Math.max(4, rr * 0.5)
  ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2)
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = Math.max(2, rr * 0.13); ctx.stroke()
  ctx.shadowBlur = 0
  ctx.beginPath(); ctx.arc(p.x, p.y, rr * 0.7, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(74,222,128,0.35)'; ctx.lineWidth = Math.max(1, rr * 0.05); ctx.stroke()
  ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, rr * 0.06), 0, Math.PI * 2)
  ctx.fillStyle = '#bbf7d0'; ctx.fill()
  ctx.restore()
}

function drawObstacle(ctx, p, r, s, o) {
  const spin = s.elapsed * 1.6 + o.id * 7
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(spin)
  ctx.setLineDash([r * 0.35, r * 0.35])
  ctx.strokeStyle = 'rgba(248,113,113,0.5)'
  ctx.lineWidth = Math.max(1.5, r * 0.09)
  ctx.beginPath(); ctx.arc(0, 0, r * 1.22, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  const grad = ctx.createRadialGradient(p.x, p.y - r * 0.3, r * 0.1, p.x, p.y, r)
  grad.addColorStop(0, '#fca5a5')
  grad.addColorStop(1, '#dc2626')
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = `900 ${Math.max(9, r * 0.95)}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('!', p.x, p.y + r * 0.02)
}

// "Voo 3D — Missão de Campo": pilote o drone real da GeoSense por um
// corredor 3D, capturando os pontos de apoio (GCPs, anéis verdes) e
// desviando de obstáculos (postes/aves), como num voo fotogramétrico real.
export default function DroneFlightSimGame({ onComplete }) {
  const canvasRef = useRef(null)
  const [done, setDone] = useState(false)
  const [droneImg, setDroneImg] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let alive = true
    loadKeyedImage(droneSrc).then((img) => { if (alive) setDroneImg(img) }).catch(() => { if (alive) setLoadError(true) })
    return () => { alive = false }
  }, [])

  const state = useRef(null)
  if (!state.current) {
    state.current = {
      pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 },
      held: new Set(),
      objects: [],
      spawnQueue: buildSpawnQueue(),
      spawnAcc: 0,
      elapsed: 0,
      score: 0,
      gatesHit: 0, gatesMiss: 0, obstHit: 0, obstAvoid: 0,
      popups: [],
      flashRed: 0, flashGreen: 0,
      stars: Array.from({ length: 50 }, () => ({
        x: rand(0, W), y: rand(6, GROUND_Y * 0.8), r: rand(0.5, 1.7),
        phase: rand(0, Math.PI * 2), speed: rand(0.5, 1.6), drift: rand(2, 9),
      })),
      finished: false,
    }
  }

  useEffect(() => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }
    function onDown(e) { const k = keyMap[e.key]; if (!k) return; e.preventDefault(); state.current.held.add(k) }
    function onUp(e) { const k = keyMap[e.key]; if (!k) return; state.current.held.delete(k) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  useGameLoop((dt) => {
    const s = state.current
    if (s.finished || !droneImg) { render(); return }
    s.elapsed += dt

    // física do drone
    const h = s.held
    if (h.has('left')) s.vel.x -= ACC * dt
    if (h.has('right')) s.vel.x += ACC * dt
    if (h.has('up')) s.vel.y += ACC * dt
    if (h.has('down')) s.vel.y -= ACC * dt
    const damp = Math.max(0, 1 - FRICTION * dt)
    s.vel.x *= damp; s.vel.y *= damp
    s.vel.x = clamp(s.vel.x, -MAX_SPEED, MAX_SPEED)
    s.vel.y = clamp(s.vel.y, -MAX_SPEED, MAX_SPEED)
    s.pos.x = clamp(s.pos.x + s.vel.x * dt, -POS_LIMIT_X, POS_LIMIT_X)
    s.pos.y = clamp(s.pos.y + s.vel.y * dt, -POS_LIMIT_Y, POS_LIMIT_Y)

    // dificuldade progressiva
    const progress = 1 - s.spawnQueue.length / (TOTAL_GATES + TOTAL_OBST)
    const speed = 250 + progress * 170

    // spawn
    s.spawnAcc += dt
    if (s.spawnAcc > 2.2 && s.spawnQueue.length > 0) {
      s.spawnAcc = 0
      const kind = s.spawnQueue.shift()
      s.objects.push({ id: Math.random(), kind, x: rand(-160, 160), y: rand(-85, 85), z: Z_FAR, resolved: false })
    }

    // avança objetos
    s.objects.forEach((o) => { o.z -= speed * dt })

    // resolve colisões/capturas
    s.objects.forEach((o) => {
      if (o.resolved) return
      if (o.z <= COLLIDE_Z) {
        o.resolved = true
        const dx = o.x - s.pos.x, dy = o.y - s.pos.y
        const d = Math.hypot(dx, dy)
        const p = project(o.x, o.y, DRONE_Z)
        if (o.kind === 'gate') {
          if (d <= GATE_RADIUS_WORLD) {
            s.gatesHit++; s.score += 10; s.flashGreen = 0.18
            s.popups.push({ x: p.x, y: p.y, text: '+10 GCP', color: '#22c55e', life: 0.9 })
          } else {
            s.gatesMiss++; s.score = Math.max(0, s.score - 4)
            s.popups.push({ x: p.x, y: p.y, text: 'GCP perdido', color: '#94a3b8', life: 0.9 })
          }
        } else {
          if (d <= OBST_RADIUS_WORLD) {
            s.obstHit++; s.score = Math.max(0, s.score - 15); s.flashRed = 0.25
            s.popups.push({ x: p.x, y: p.y, text: 'Colisão!', color: '#ef4444', life: 0.9 })
          } else {
            s.obstAvoid++; s.score += 4
            s.popups.push({ x: p.x, y: p.y, text: 'Desviou', color: '#38bdf8', life: 0.9 })
          }
        }
      }
    })
    s.objects = s.objects.filter((o) => o.z > COLLIDE_Z - 40)
    if (s.flashRed > 0) s.flashRed -= dt
    if (s.flashGreen > 0) s.flashGreen -= dt
    s.popups.forEach((p) => { p.y -= dt * 26; p.life -= dt })
    s.popups = s.popups.filter((p) => p.life > 0)

    if (!s.finished && s.spawnQueue.length === 0 && s.objects.length === 0) {
      s.finished = true
      const gateRatio = s.gatesHit / TOTAL_GATES
      const obstRatio = s.obstAvoid / TOTAL_OBST
      const score = Math.round(clamp(100 * (0.65 * gateRatio + 0.35 * obstRatio), 0, 100))
      setTimeout(() => {
        setDone(true)
        onComplete(score, {
          voo: `${s.gatesHit}/${TOTAL_GATES} GCPs`,
          obstaculosEvitados: `${s.obstAvoid}/${TOTAL_OBST}`,
          pontuacaoDeVoo: s.score,
        })
      }, 300)
    }

    render(dt)
  }, !done)

  function render(dt = 0) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    // céu com brilho quente no horizonte (ponto de fuga)
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, '#040b13'); sky.addColorStop(0.55, '#0a2033'); sky.addColorStop(1, '#123049')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, GROUND_Y)

    const glow = ctx.createRadialGradient(CENTER_X, GROUND_Y, 0, CENTER_X, GROUND_Y, 300)
    glow.addColorStop(0, 'rgba(249,115,22,0.16)')
    glow.addColorStop(1, 'rgba(249,115,22,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, GROUND_Y)

    // estrelas cintilantes (substituem as antigas "nuvens" em bolha)
    s.stars.forEach((st) => {
      st.x -= dt * st.drift
      if (st.x < -4) st.x = W + 4
      const tw = 0.3 + 0.5 * Math.abs(Math.sin(s.elapsed * st.speed + st.phase))
      ctx.globalAlpha = tw
      ctx.fillStyle = '#e2f1ff'
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 1

    drawRidge(ctx)

    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H)
    groundGrad.addColorStop(0, '#0e2436'); groundGrad.addColorStop(1, '#050d15')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)

    // grade de perspectiva (solo) — mais viva perto do drone, esmaece ao longe
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const z = Z_FAR * Math.pow(i / 10, 2.4)
      const a = project(-320, -120, z), b = project(320, -120, z)
      ctx.strokeStyle = `rgba(56,189,248,${0.06 + 0.22 * (i / 10)})`
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(56,189,248,0.18)'
    for (let x = -320; x <= 320; x += 80) {
      const a = project(x, -120, Z_FAR), b = project(x, -120, 30)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }

    // objetos (do mais longe pro mais perto)
    const sorted = [...s.objects].sort((a, b) => b.z - a.z)
    sorted.forEach((o) => {
      const p = project(o.x, o.y, o.z)
      const r = (o.kind === 'gate' ? GATE_RADIUS_WORLD : OBST_RADIUS_WORLD) * p.scale
      if (r < 0.6) return
      if (o.kind === 'gate') drawGate(ctx, p, r, s, o)
      else drawObstacle(ctx, p, r, s, o)
    })

    // sombra do drone no chão
    const groundProj = project(s.pos.x, -120, DRONE_Z)
    const shadowGrad = ctx.createRadialGradient(groundProj.x, groundProj.y, 0, groundProj.x, groundProj.y, 36)
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.45)'); shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.ellipse(groundProj.x, groundProj.y, 34, 9, 0, 0, Math.PI * 2)
    ctx.fillStyle = shadowGrad
    ctx.fill()

    // drone (foto real, fundo removido)
    const dp = project(s.pos.x, s.pos.y, DRONE_Z)
    if (droneImg) {
      const bank = clamp(s.vel.x * 0.0016, -0.32, 0.32)
      const bob = Math.sin(s.elapsed * 3.2) * 3
      const baseW = 178 * dp.scale
      const baseH = baseW * (droneImg.height / droneImg.width)
      ctx.save()
      ctx.translate(dp.x, dp.y + bob)
      ctx.rotate(bank)
      ctx.drawImage(droneImg, -baseW / 2, -baseH / 2, baseW, baseH)
      const spinAngle = s.elapsed * 24
      PROP_HUBS.forEach((hub) => {
        const hx = -baseW / 2 + hub.x * baseW
        const hy = -baseH / 2 + hub.y * baseH
        drawSpinningProp(ctx, hx, hy, hub.r * baseW, spinAngle)
      })
      ctx.restore()
    } else {
      ctx.fillStyle = '#f97316'
      ctx.beginPath(); ctx.arc(dp.x, dp.y, 16, 0, Math.PI * 2); ctx.fill()
    }

    s.popups.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.font = '800 15px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
      ctx.fillStyle = p.color
      ctx.fillText(p.text, p.x, p.y)
      ctx.restore()
    })

    drawEdgeFlash(ctx, W, H, '239,68,68', s.flashRed)
    drawEdgeFlash(ctx, W, H, '34,197,94', s.flashGreen)
    drawVignette(ctx, W, H)

    drawFlightHud(ctx, W, s, TOTAL_GATES, TOTAL_OBST)
    drawCornerBrackets(ctx, W, H)

    if (!droneImg && !loadError) {
      ctx.fillStyle = 'rgba(6,12,20,0.75)'
      ctx.fillRect(0, 0, W, H)
      roundRect(ctx, W / 2 - 110, H / 2 - 22, 220, 44, 12)
      ctx.fillStyle = 'rgba(15,30,45,0.9)'
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('Carregando o drone…', W / 2, H / 2 + 1)
    }
  }

  useEffect(() => { render() }, [droneImg])

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full rounded-2xl border border-border shadow-lg"
        style={{ aspectRatio: `${W}/${H}` }}
      />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text">
          <kbd className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px]">WASD</kbd> ou setas para pilotar
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" /> GCP — capture passando pelo anel
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" /> Obstáculo — desvie
        </span>
      </div>
    </div>
  )
}

function buildSpawnQueue() {
  const q = [...Array(TOTAL_GATES).fill('gate'), ...Array(TOTAL_OBST).fill('obstacle')]
  for (let i = q.length - 1; i > 0; i--) { const j = randInt(0, i);[q[i], q[j]] = [q[j], q[i]] }
  return q
}
