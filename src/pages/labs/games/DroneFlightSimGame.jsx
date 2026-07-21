import { useEffect, useRef, useState } from 'react'
import { useGameLoop, rand, randInt, clamp, loadKeyedImage, drawHud } from '../gameUtils'
import droneSrc from '../../../assets/drone.png'

const W = 720, H = 420
const CENTER_X = W / 2
const GROUND_Y = H * 0.66
const FOCAL = 260
const Z_FAR = 1400
const COLLIDE_Z = 60
const DRONE_Z = 78

const TOTAL_GATES = 10
const TOTAL_OBST = 8
const GATE_RADIUS_WORLD = 60
const OBST_RADIUS_WORLD = 42

const ACC = 460
const MAX_SPEED = 230
const FRICTION = 3.4
const POS_LIMIT_X = 155
const POS_LIMIT_Y = 95

function project(worldX, worldY, z) {
  const scale = FOCAL / (z + FOCAL)
  return { x: CENTER_X + worldX * scale, y: GROUND_Y - worldY * scale * 0.9, scale }
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
      clouds: Array.from({ length: 5 }, () => ({ x: rand(0, W), y: rand(20, 90), r: rand(30, 60) })),
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
    if (s.spawnAcc > 0.85 && s.spawnQueue.length > 0) {
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

    render()
  }, !done)

  function render() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, '#0a1826'); sky.addColorStop(1, '#123249')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, GROUND_Y)
    ctx.fillStyle = '#0c1f30'
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)

    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    s.clouds.forEach((cl) => {
      cl.x -= 6 * (1 / 60)
      if (cl.x < -80) cl.x = W + 80
      ctx.beginPath(); ctx.ellipse(cl.x, cl.y, cl.r, cl.r * 0.4, 0, 0, Math.PI * 2); ctx.fill()
    })

    // grade de perspectiva (solo)
    ctx.strokeStyle = 'rgba(56,189,248,0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const z = Z_FAR * Math.pow(i / 10, 2.4)
      const a = project(-320, -120, z), b = project(320, -120, z)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
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
      if (o.kind === 'gate') {
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = Math.max(2, r * 0.12); ctx.stroke()
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34,197,94,0.35)'; ctx.lineWidth = Math.max(1, r * 0.05); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.fill()
        ctx.fillStyle = 'white'; ctx.font = `bold ${Math.max(9, r * 0.9)}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('!', p.x, p.y)
      }
    })

    // sombra do drone no chão
    const groundProj = project(s.pos.x, -120, DRONE_Z)
    ctx.beginPath()
    ctx.ellipse(groundProj.x, groundProj.y, 34, 9, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
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
      ctx.restore()
    } else {
      ctx.fillStyle = '#f97316'
      ctx.beginPath(); ctx.arc(dp.x, dp.y, 16, 0, Math.PI * 2); ctx.fill()
    }

    s.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x, p.y)
      ctx.globalAlpha = 1
    })

    if (s.flashRed > 0) { ctx.fillStyle = `rgba(239,68,68,${s.flashRed * 0.45})`; ctx.fillRect(0, 0, W, H) }
    if (s.flashGreen > 0) { ctx.fillStyle = `rgba(34,197,94,${s.flashGreen * 0.3})`; ctx.fillRect(0, 0, W, H) }

    const remaining = s.spawnQueue.length + s.objects.length
    const totalCount = TOTAL_GATES + TOTAL_OBST
    drawHud(ctx, W, {
      left: `GCPs ${s.gatesHit}/${TOTAL_GATES}`,
      center: `Progresso ${Math.round(((totalCount - remaining) / totalCount) * 100)}%`,
      right: `Placar ${s.score}`,
    })

    if (!droneImg && !loadError) {
      ctx.fillStyle = 'rgba(8,18,28,0.7)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 15px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Carregando o drone…', W / 2, H / 2)
    }
  }

  useEffect(() => { render() }, [droneImg])

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-border" style={{ aspectRatio: `${W}/${H}` }} />
      <p className="mt-3 text-center text-sm text-muted">
        Use as setas ou <strong>WASD</strong> para pilotar. Passe pelos anéis <strong className="text-success">verdes</strong> (GCPs) e desvie dos <strong className="text-rose-500">obstáculos</strong>.
      </p>
    </div>
  )
}

function buildSpawnQueue() {
  const q = [...Array(TOTAL_GATES).fill('gate'), ...Array(TOTAL_OBST).fill('obstacle')]
  for (let i = q.length - 1; i > 0; i--) { const j = randInt(0, i);[q[i], q[j]] = [q[j], q[i]] }
  return q
}
