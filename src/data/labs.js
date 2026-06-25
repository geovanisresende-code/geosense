// ── GeoSense Labs ───────────────────────────────────────────────────────────
// Laboratório virtual de geotecnologias: aprender fazendo.
// Cada experimento entrega dados reais (e imperfeitos), o usuário toma decisões
// técnicas, vê o impacto imediato (qualidade / custo / precisão) e compara o
// seu resultado com a solução de um especialista.

export const labProgress = {
  level: 4,
  levelLabel: 'Geotécnico Júnior',
  xp: 1850,
  xpToNext: 2500,
  completed: 2,
  total: 6,
  streak: 7,
}

// ── Experimento 1 — Planejamento de Voo Fotogramétrico ──────────────────────
const IMG_W = 5472
const IMG_H = 3648
const FIELD_W = 1000 // m
const FIELD_L = 500 // m  (50 ha)
const gsdFromH = (h) => h * 0.0274 // cm/px — sensor DJI P4 RTK (aprox.)

function computeVoo(p) {
  const gsd = gsdFromH(p.altura)
  const fw = (gsd / 100) * IMG_W
  const fh = (gsd / 100) * IMG_H
  const lineSpacing = fw * (1 - p.lateral / 100)
  const photoSpacing = fh * (1 - p.frontal / 100)
  const lines = Math.ceil(FIELD_L / lineSpacing)
  const perLine = Math.ceil(FIELD_W / photoSpacing)
  const photos = lines * perLine
  const dist = lines * FIELD_W
  const timeMin = dist / p.velocidade / 60 + lines * 0.3
  const batteries = Math.ceil(timeMin / 22)
  return { gsd, photos, timeMin, batteries, lines }
}

function evalVoo(p, m) {
  const c = []
  let score = 0
  const gsdOk = m.gsd <= 4
  c.push({
    label: `Precisão · GSD ${m.gsd.toFixed(2)} cm/px`,
    ok: gsdOk,
    detail: gsdOk
      ? m.gsd <= 3
        ? 'Excelente para topografia de precisão.'
        : 'Aceitável, mas dá para refinar.'
      : 'Acima de 4 cm/px compromete a precisão do levantamento.',
  })
  score += m.gsd <= 3 ? 30 : gsdOk ? 20 : 0

  const fOk = p.frontal >= 75
  c.push({
    label: `Sobreposição frontal · ${p.frontal}%`,
    ok: fOk,
    detail: fOk ? 'Boa para reconstrução 3D.' : 'Abaixo de 75% gera buracos no modelo.',
  })
  score += fOk ? 20 : 5

  const lOk = p.lateral >= 65
  c.push({
    label: `Sobreposição lateral · ${p.lateral}%`,
    ok: lOk,
    detail: lOk ? 'Cobertura adequada entre faixas.' : 'Abaixo de 65% causa falhas entre faixas.',
  })
  score += lOk ? 20 : 5

  const effOk = m.timeMin <= 30
  c.push({
    label: `Eficiência · ${m.timeMin.toFixed(0)} min · ${m.batteries} bateria(s)`,
    ok: effOk,
    detail: effOk ? 'Voo eficiente para a área.' : 'Voo longo: avalie subir a altura ou a velocidade.',
  })
  score += effOk ? 30 : 15

  return { score: Math.min(100, Math.round(score)), criteria: c }
}

// ── Experimento 3 — Geração de MDT (filtragem da nuvem) ─────────────────────
function computeMDT(p) {
  const vegRemain = Math.max(0, 55 - p.aggr) // % de vegetação/objetos ainda na nuvem
  const overcut = Math.max(0, p.aggr - 70) // % de terreno real removido por engano
  const gridPenalty = { 0.25: 0.06, 0.5: 0.02, 1: 0, 2: 0.04, 5: 0.12 }[p.grid] ?? 0
  const interpQual = { nn: 0.04, tin: 0.0, krig: -0.01 }[p.interp] ?? 0
  const rmse = Math.max(0.02, 0.05 + vegRemain * 0.006 + overcut * 0.012 + gridPenalty + interpQual)
  const completeness = Math.max(40, Math.min(100, 100 - overcut * 1.6 - gridPenalty * 40))
  return { rmse, vegRemain, overcut, completeness }
}

function evalMDT(p, m) {
  const c = []
  let score = 0
  const rmseOk = m.rmse <= 0.1
  c.push({
    label: `Acurácia altimétrica · RMSE ${m.rmse.toFixed(2)} m`,
    ok: rmseOk,
    detail: rmseOk ? 'Dentro do padrão para MDT de engenharia.' : 'RMSE alto: o terreno está distorcido.',
  })
  score += m.rmse <= 0.08 ? 40 : rmseOk ? 28 : 0

  const vegOk = m.vegRemain <= 8
  c.push({
    label: `Filtragem de vegetação · ${m.vegRemain.toFixed(0)}% residual`,
    ok: vegOk,
    detail: vegOk ? 'Vegetação e objetos bem removidos.' : 'Filtro fraco: vegetação virou “falso terreno”.',
  })
  score += vegOk ? 30 : 8

  const cutOk = m.overcut <= 4
  c.push({
    label: `Preservação do terreno · ${m.completeness.toFixed(0)}% íntegro`,
    ok: cutOk,
    detail: cutOk ? 'Feições reais do relevo preservadas.' : 'Filtro agressivo demais: apagou taludes e quebras reais.',
  })
  score += cutOk ? 30 : 10

  return { score: Math.min(100, Math.round(score)), criteria: c }
}

// ── Experimento 2 — Detecção de Falhas GNSS (classificação) ─────────────────
const gnssPoints = [
  { id: 'P1', pdop: 1.8, sats: 12, sigma: 0.012, bad: false },
  { id: 'P2', pdop: 2.4, sats: 10, sigma: 0.018, bad: false },
  { id: 'P3', pdop: 6.8, sats: 5, sigma: 0.085, bad: true, why: 'PDOP alto e poucos satélites — geometria fraca.' },
  { id: 'P4', pdop: 2.1, sats: 11, sigma: 0.015, bad: false },
  { id: 'P5', pdop: 3.1, sats: 9, sigma: 0.22, bad: true, why: 'Sigma altíssimo apesar do PDOP ok — multicaminho.' },
  { id: 'P6', pdop: 1.9, sats: 13, sigma: 0.011, bad: false },
  { id: 'P7', pdop: 8.5, sats: 4, sigma: 0.14, bad: true, why: 'Solução degradada: 4 satélites e PDOP 8.5.' },
  { id: 'P8', pdop: 2.7, sats: 8, sigma: 0.024, bad: false },
]

export const experiments = [
  {
    id: 'planejamento-voo',
    number: 1,
    title: 'Planejar um Voo Fotogramétrico',
    category: 'Drones · Fotogrametria',
    icon: 'drone',
    difficulty: 'Iniciante',
    xp: 250,
    duration: '15 min',
    status: 'available',
    objective:
      'Planeje um voo para mapear uma gleba de 50 ha atingindo GSD ≤ 3 cm/px com sobreposição segura — gastando o mínimo de baterias.',
    scenario:
      'O cliente entregou só o limite da área e um DJI Phantom 4 RTK. Não há plano de voo pronto: as decisões de altura, sobreposição e velocidade são suas.',
    dataHint: 'Área: 1000 m × 500 m · Câmera: 20 MP (5472×3648) · Bateria útil: ~22 min de voo.',
    type: 'params',
    controls: [
      { key: 'altura', label: 'Altura de voo', type: 'slider', min: 40, max: 300, step: 5, unit: 'm', default: 80, help: 'Mais alto = cobre mais rápido, porém pior GSD.' },
      { key: 'frontal', label: 'Sobreposição frontal', type: 'slider', min: 55, max: 90, step: 5, unit: '%', default: 65, help: 'Recomendado ≥ 75% para boa reconstrução.' },
      { key: 'lateral', label: 'Sobreposição lateral', type: 'slider', min: 45, max: 85, step: 5, unit: '%', default: 55, help: 'Recomendado ≥ 65% entre faixas.' },
      { key: 'velocidade', label: 'Velocidade de voo', type: 'slider', min: 3, max: 15, step: 1, unit: 'm/s', default: 10, help: 'Rápido demais pode causar borrão de movimento.' },
    ],
    metricsDisplay: [
      { key: 'gsd', label: 'GSD', unit: 'cm/px', fmt: (v) => v.toFixed(2) },
      { key: 'photos', label: 'Nº de fotos', unit: '', fmt: (v) => v.toLocaleString('pt-BR') },
      { key: 'timeMin', label: 'Tempo de voo', unit: 'min', fmt: (v) => v.toFixed(0) },
      { key: 'batteries', label: 'Baterias', unit: '', fmt: (v) => String(v) },
    ],
    compute: computeVoo,
    evaluate: evalVoo,
    pro: {
      params: { altura: 100, frontal: 80, lateral: 70, velocidade: 8 },
      note: 'O especialista subiu para 100 m (GSD 2,74 cm/px), priorizou sobreposição 80/70 para o modelo fechar sem buracos e manteve 8 m/s para não borrar — tudo dentro de uma bateria de margem.',
    },
  },
  {
    id: 'falhas-gnss',
    number: 2,
    title: 'Detectar Falhas em Dados GNSS',
    category: 'Topografia · GNSS',
    icon: 'satellite',
    difficulty: 'Intermediário',
    xp: 300,
    duration: '12 min',
    status: 'available',
    objective:
      'Receba um arquivo de rastreio GNSS com 8 pontos e descarte apenas os que estão comprometidos. Rejeitar pontos bons custa retrabalho; aceitar pontos ruins arruína o levantamento.',
    scenario:
      'O auxiliar coletou os pontos com pressa, em meio a árvores e uma edificação. O relatório não veio limpo — alguns pontos têm geometria fraca ou multicaminho escondido.',
    dataHint: 'Avalie PDOP (geometria), nº de satélites e sigma (incerteza). Marque os pontos a REJEITAR.',
    type: 'classify',
    points: gnssPoints,
    pro: {
      reject: ['P3', 'P5', 'P7'],
      note: 'P3 e P7 caem na hora pelo PDOP/satélites. A pegadinha é o P5: PDOP parece ok, mas o sigma de 0,22 m denuncia multicaminho — o especialista rejeita pela incerteza, não só pela geometria.',
    },
  },
  {
    id: 'gerar-mdt',
    number: 3,
    title: 'Gerar um MDT a partir da Nuvem',
    category: 'Geoprocessamento · LiDAR',
    icon: 'layers',
    difficulty: 'Intermediário',
    xp: 350,
    duration: '18 min',
    status: 'available',
    objective:
      'Filtre uma nuvem de pontos para gerar um Modelo Digital de Terreno limpo: remova vegetação e edificações sem apagar as feições reais do relevo.',
    scenario:
      'A nuvem bruta tem árvores, um galpão e ruído de borda. Filtrar de menos deixa “falso terreno”; filtrar demais apaga taludes e quebras de relevo verdadeiras.',
    dataHint: 'Nuvem: ~12 M pontos · Relevo ondulado com talude e curso d’água · Cobertura: pastagem + mata ciliar.',
    type: 'params',
    controls: [
      { key: 'aggr', label: 'Agressividade do filtro de solo', type: 'slider', min: 0, max: 100, step: 5, unit: '%', default: 30, help: 'Baixo deixa vegetação; alto remove terreno real.' },
      {
        key: 'grid',
        label: 'Resolução do grid',
        type: 'select',
        default: 1,
        options: [
          { value: 0.25, label: '0,25 m (muito fina)' },
          { value: 0.5, label: '0,5 m (fina)' },
          { value: 1, label: '1,0 m (equilibrada)' },
          { value: 2, label: '2,0 m (grossa)' },
          { value: 5, label: '5,0 m (muito grossa)' },
        ],
        help: 'Fina demais capta ruído; grossa demais perde detalhe.',
      },
      {
        key: 'interp',
        label: 'Método de interpolação',
        type: 'select',
        default: 'nn',
        options: [
          { value: 'nn', label: 'Vizinho mais próximo' },
          { value: 'tin', label: 'TIN (rede triangular)' },
          { value: 'krig', label: 'Krigagem' },
        ],
        help: 'TIN/Krigagem suavizam melhor que vizinho mais próximo.',
      },
    ],
    metricsDisplay: [
      { key: 'rmse', label: 'RMSE altimétrico', unit: 'm', fmt: (v) => v.toFixed(2) },
      { key: 'vegRemain', label: 'Vegetação residual', unit: '%', fmt: (v) => v.toFixed(0) },
      { key: 'completeness', label: 'Terreno íntegro', unit: '%', fmt: (v) => v.toFixed(0) },
    ],
    compute: computeMDT,
    evaluate: evalMDT,
    pro: {
      params: { aggr: 55, grid: 1, interp: 'tin' },
      note: 'O especialista calibrou o filtro em 55% — suficiente para tirar a mata sem comer o talude — em grid de 1 m com TIN, equilibrando detalhe e suavização. RMSE final de 0,05 m.',
    },
  },
  {
    id: 'ortomosaico',
    number: 4,
    title: 'Corrigir um Ortomosaico com Distorções',
    category: 'Fotogrametria',
    icon: 'image',
    difficulty: 'Avançado',
    xp: 400,
    duration: '20 min',
    status: 'locked',
    objective: 'Identifique a causa de distorções (efeito “derretido”) em um ortomosaico e ajuste o pipeline.',
    scenario: 'Em breve: experimento liberado ao concluir “Gerar um MDT”.',
  },
  {
    id: 'volume-pilha',
    number: 5,
    title: 'Calcular Volume de uma Pilha de Estéril',
    category: 'Mineração · Topografia',
    icon: 'mountain',
    difficulty: 'Avançado',
    xp: 400,
    duration: '20 min',
    status: 'locked',
    objective: 'Defina a superfície de base correta e calcule o volume com erro < 2%.',
    scenario: 'Em breve: caso real de uma mineradora atendida pela GeoSense.',
  },
  {
    id: 'caso-real',
    number: 6,
    title: 'Caso Real GeoSense — Loteamento',
    category: 'Projeto Real',
    icon: 'briefcase',
    difficulty: 'Especialista',
    xp: 600,
    duration: '40 min',
    status: 'locked',
    objective: 'Entre em um projeto verdadeiro da empresa e resolva o problema como o especialista resolveu.',
    scenario: 'Em breve: o topo da escada de aprendizado — dados de um projeto real, ponta a ponta.',
  },
]

export function evaluateGnss(experiment, selectedIds) {
  const badSet = new Set(experiment.points.filter((p) => p.bad).map((p) => p.id))
  const selected = new Set(selectedIds)
  let fn = 0
  let fp = 0
  const criteria = []
  experiment.points.forEach((pt) => {
    const isBad = badSet.has(pt.id)
    const picked = selected.has(pt.id)
    if (isBad && !picked) fn++
    if (!isBad && picked) fp++
  })
  experiment.points
    .filter((p) => p.bad)
    .forEach((pt) => {
      const caught = selected.has(pt.id)
      criteria.push({
        label: `${pt.id} · ponto problemático`,
        ok: caught,
        detail: caught ? `Bem identificado — ${pt.why}` : `Você deixou passar: ${pt.why}`,
      })
    })
  const falsePos = experiment.points.filter((p) => !p.bad && selected.has(p.id))
  falsePos.forEach((pt) => {
    criteria.push({
      label: `${pt.id} · era um ponto bom`,
      ok: false,
      detail: 'Você rejeitou um ponto válido — isso gera retrabalho de campo desnecessário.',
    })
  })
  const score = Math.max(0, Math.min(100, 100 - fn * 25 - fp * 15))
  return { score, criteria, fn, fp }
}
