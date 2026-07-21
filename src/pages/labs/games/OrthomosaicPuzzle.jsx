import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { rand, randInt } from '../gameUtils'

const SIZE = 480

// Desenha uma cena aérea procedural (talhões, rio, estrada, árvores) —
// nada de imagem externa, tudo formas/gradientes gerados por código.
function paintScene(ctx) {
  ctx.fillStyle = '#5a7d3e'
  ctx.fillRect(0, 0, SIZE, SIZE)
  const cols = 4, rows = 4, pw = SIZE / cols, ph = SIZE / rows
  const greens = ['#5a7d3e', '#6c9146', '#78a352', '#4f7238', '#8aa63f']
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = greens[(c * 3 + r * 5) % greens.length]
      ctx.fillRect(c * pw, r * ph, pw, ph)
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 2
      ctx.strokeRect(c * pw, r * ph, pw, ph)
    }
  }
  // rio serpenteando
  ctx.strokeStyle = '#3b7bb0'
  ctx.lineWidth = 16
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-10, SIZE * 0.15)
  ctx.bezierCurveTo(SIZE * 0.3, SIZE * 0.1, SIZE * 0.25, SIZE * 0.55, SIZE * 0.6, SIZE * 0.5)
  ctx.bezierCurveTo(SIZE * 0.85, SIZE * 0.46, SIZE * 0.8, SIZE * 0.9, SIZE + 10, SIZE * 0.95)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 3
  ctx.stroke()
  // estrada
  ctx.strokeStyle = '#8a7355'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(SIZE * 0.05, SIZE + 10)
  ctx.lineTo(SIZE * 0.95, -10)
  ctx.stroke()
  // clareiras de árvores
  const rng = mulberry32(42)
  for (let i = 0; i < 9; i++) {
    const cx = rng() * SIZE, cy = rng() * SIZE
    for (let j = 0; j < 6; j++) {
      const ox = cx + (rng() - 0.5) * 40
      const oy = cy + (rng() - 0.5) * 40
      ctx.beginPath()
      ctx.arc(ox, oy, 7 + rng() * 5, 0, Math.PI * 2)
      ctx.fillStyle = '#2f5a24'
      ctx.fill()
    }
  }
  // casinhas (vilarejo)
  ctx.fillStyle = '#e8e2d0'
  for (let i = 0; i < 5; i++) {
    const x = SIZE * 0.62 + (i % 3) * 22
    const y = SIZE * 0.72 + Math.floor(i / 3) * 22
    ctx.fillRect(x, y, 14, 14)
  }
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffledPermutation(n) {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  const solved = arr.every((v, i) => v === i)
  if (solved) return shuffledPermutation(n)
  return arr
}

// "Quebra-cabeça do Mosaico" — clique em duas peças para trocá-las e
// remontar o ortomosaico antes do tempo/movimentos acabarem.
export default function OrthomosaicPuzzle({ grid = 4, timeLimit = 150, onComplete }) {
  const sourceRef = useRef(null)
  const boardRef = useRef(null)
  const [perm, setPerm] = useState(() => shuffledPermutation(grid * grid))
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [showRef, setShowRef] = useState(false)
  const [finished, setFinished] = useState(false)
  const startRef = useRef(performance.now())
  const doneRef = useRef(false)
  const tile = SIZE / grid

  const source = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = SIZE; c.height = SIZE
    paintScene(c.getContext('2d'))
    return c
  }, [])

  useEffect(() => {
    sourceRef.current = source
  }, [source])

  useEffect(() => {
    const id = setInterval(() => {
      if (doneRef.current) return
      const t = (performance.now() - startRef.current) / 1000
      setElapsed(t)
      if (t >= timeLimit) finish(perm, t)
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perm])

  useEffect(() => { draw() }) // redraw every render

  function draw() {
    const canvas = boardRef.current
    if (!canvas || !sourceRef.current) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)
    for (let pos = 0; pos < perm.length; pos++) {
      const originIdx = perm[pos]
      const oc = originIdx % grid, or_ = Math.floor(originIdx / grid)
      const pc = pos % grid, pr = Math.floor(pos / grid)
      ctx.drawImage(sourceRef.current, oc * tile, or_ * tile, tile, tile, pc * tile, pr * tile, tile, tile)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.strokeRect(pc * tile + 0.5, pr * tile + 0.5, tile - 1, tile - 1)
      if (selected === pos) {
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 4
        ctx.strokeRect(pc * tile + 2, pr * tile + 2, tile - 4, tile - 4)
      }
    }
  }

  function handleClick(e) {
    if (finished) return
    const rect = boardRef.current.getBoundingClientRect()
    const scale = SIZE / rect.width
    const x = (e.clientX - rect.left) * scale
    const y = (e.clientY - rect.top) * scale
    const pc = Math.min(grid - 1, Math.floor(x / tile))
    const pr = Math.min(grid - 1, Math.floor(y / tile))
    const pos = pr * grid + pc

    if (selected === null) { setSelected(pos); return }
    if (selected === pos) { setSelected(null); return }

    const next = [...perm]
    ;[next[selected], next[pos]] = [next[pos], next[selected]]
    setPerm(next)
    setSelected(null)
    const newMoves = moves + 1
    setMoves(newMoves)

    if (next.every((v, i) => v === i)) finish(next, elapsed, newMoves)
  }

  function finish(finalPerm, t, finalMoves) {
    if (doneRef.current) return
    doneRef.current = true
    setFinished(true)
    const correctCount = finalPerm.filter((v, i) => v === i).length
    const solved = correctCount === finalPerm.length
    const parMoves = grid * grid
    let score
    if (solved) {
      const usedMoves = finalMoves ?? moves
      score = Math.round(Math.max(30, 100 - Math.max(0, usedMoves - parMoves) * 3 - t * 0.4))
    } else {
      score = Math.round((correctCount / finalPerm.length) * 70)
    }
    score = Math.max(0, Math.min(100, score))
    setTimeout(() => onComplete(score, { solved, moves: finalMoves ?? moves, timeSec: Math.round(t), correctCount, total: finalPerm.length }), 350)
  }

  return (
    <div>
      <div className="relative mx-auto" style={{ maxWidth: SIZE }}>
        <canvas
          ref={boardRef} width={SIZE} height={SIZE}
          className="w-full cursor-pointer rounded-xl border border-border"
          onClick={handleClick}
        />
        {showRef && (
          <div className="absolute right-2 top-2 overflow-hidden rounded-lg border-2 border-brand shadow-xl" style={{ width: 120, height: 120 }}>
            <RefPreview source={source} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>Movimentos: <strong className="text-text">{moves}</strong> · Tempo: <strong className="text-text">{elapsed.toFixed(0)}s</strong></span>
        <button
          onMouseDown={() => setShowRef(true)}
          onMouseUp={() => setShowRef(false)}
          onMouseLeave={() => setShowRef(false)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-2"
        >
          <Eye size={14} /> Segurar p/ ver referência
        </button>
      </div>
      <p className="mt-2 text-center text-sm text-muted">Clique em duas peças para trocá-las e remontar a imagem aérea.</p>
    </div>
  )
}

function RefPreview({ source }) {
  const ref = useRef(null)
  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    ctx.drawImage(source, 0, 0, 120, 120)
  }, [source])
  return <canvas ref={ref} width={120} height={120} />
}
