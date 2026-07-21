// Progresso do GeoSense Labs — persistido no navegador (localStorage).
// Nível, XP e sequência de dias são calculados a partir do desempenho real
// do usuário nos minijogos, não são valores fixos/fictícios.
const KEY = 'geosense:labs:progress:v1'

const LEVELS = [
  { min: 0, label: 'Iniciante' },
  { min: 400, label: 'Aprendiz de Campo' },
  { min: 1000, label: 'Técnico Júnior' },
  { min: 2000, label: 'Geotécnico Pleno' },
  { min: 3400, label: 'Especialista GeoSense' },
  { min: 5200, label: 'Mestre GeoSense' },
]

function loadRaw() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
function saveRaw(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj))
}

function levelInfo(xp) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i
  const base = LEVELS[idx].min
  const next = LEVELS[idx + 1]?.min ?? base + 1800
  return { level: idx + 1, label: LEVELS[idx].label, xpIntoLevel: xp - base, xpForLevel: next - base }
}

function dayDiff(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

export function getProgress() {
  const raw = loadRaw()
  const totalXp = raw.totalXp || 0
  const completed = raw.completed || {}
  const li = levelInfo(totalXp)
  return {
    totalXp,
    completed,
    completedCount: Object.keys(completed).length,
    streak: raw.streak || 0,
    level: li.level,
    levelLabel: li.label,
    xp: li.xpIntoLevel,
    xpToNext: li.xpForLevel,
  }
}

export function recordResult(expId, score, xpEarned) {
  const raw = loadRaw()
  raw.totalXp = (raw.totalXp || 0) + xpEarned
  raw.completed = raw.completed || {}
  raw.completed[expId] = Math.max(raw.completed[expId] || 0, score)
  const today = new Date().toISOString().slice(0, 10)
  if (raw.lastDay !== today) {
    const diff = raw.lastDay ? dayDiff(raw.lastDay, today) : null
    raw.streak = diff === 1 ? (raw.streak || 0) + 1 : 1
    raw.lastDay = today
  }
  saveRaw(raw)
  return getProgress()
}
