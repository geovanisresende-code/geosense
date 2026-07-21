import { useEffect, useRef } from 'react'

// Loop de jogo baseado em requestAnimationFrame, com delta-time em segundos.
export function useGameLoop(callback, active = true) {
  const cbRef = useRef(callback)
  cbRef.current = callback
  useEffect(() => {
    if (!active) return
    let raf
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      cbRef.current(dt, now)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

export const rand = (a, b) => a + Math.random() * (b - a)
export const randInt = (a, b) => Math.floor(rand(a, b + 1))
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)

// Retorna as coordenadas do mouse/toque dentro do espaço lógico do canvas,
// convertendo de pixels de tela para as coordenadas internas de desenho.
export function canvasPoint(canvas, evt) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Carrega uma foto de produto (fundo branco de estúdio) e devolve um canvas
// com o fundo removido (chroma-key simples por proximidade de branco), pronto
// para ser desenhado sobre um cenário escuro — sem precisar editar a imagem.
export function loadKeyedImage(src, { threshold = 233, maxWidth = 460 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.naturalWidth)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const frame = ctx.getImageData(0, 0, w, h)
      const d = frame.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > threshold && d[i + 1] > threshold && d[i + 2] > threshold) d[i + 3] = 0
      }
      ctx.putImageData(frame, 0, 0)
      resolve(c)
    }
    img.onerror = reject
    img.src = src
  })
}

// HUD padrão desenhado no topo do canvas (timer, placar, etc.)
export function drawHud(ctx, W, { left = '', center = '', right = '' } = {}) {
  ctx.save()
  ctx.fillStyle = 'rgba(8,18,28,0.55)'
  ctx.fillRect(0, 0, W, 34)
  ctx.font = 'bold 15px Inter, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f8fafc'
  if (left) { ctx.textAlign = 'left'; ctx.fillText(left, 12, 17) }
  if (center) { ctx.textAlign = 'center'; ctx.fillText(center, W / 2, 17) }
  if (right) { ctx.textAlign = 'right'; ctx.fillText(right, W - 12, 17) }
  ctx.restore()
}
