import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import FlightCoverageGame from './FlightCoverageGame'
import SatelliteLockGame from './SatelliteLockGame'
import PointCloudSortGame from './PointCloudSortGame'
import OrthomosaicPuzzle from './OrthomosaicPuzzle'
import VolumeScanGame from './VolumeScanGame'

const STAGES = [
  { key: 'voo', label: 'Planejamento de Voo', Comp: FlightCoverageGame, props: { cols: 11, rows: 7 } },
  { key: 'gnss', label: 'Travar Satélites', Comp: SatelliteLockGame, props: { duration: 22 } },
  { key: 'mdt', label: 'Filtragem em Queda', Comp: PointCloudSortGame, props: { duration: 25 } },
  { key: 'orto', label: 'Mosaico', Comp: OrthomosaicPuzzle, props: { grid: 3, timeLimit: 90 } },
  { key: 'volume', label: 'Volume da Pilha', Comp: VolumeScanGame, props: { decisionTime: 15 } },
]

// "Caso Real GeoSense" — encadeia versões curtas de todos os experimentos
// em um único desafio, simulando um projeto do início ao fim.
export default function FinalCaseChallenge({ onComplete }) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState([])

  function handleStageComplete(score) {
    const next = [...scores, score]
    setScores(next)
    if (step + 1 >= STAGES.length) {
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length)
      setTimeout(() => onComplete(avg, { stageScores: next, stages: STAGES.map((s) => s.label) }), 400)
    } else {
      setStep(step + 1)
    }
  }

  const stage = STAGES[step]

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {STAGES.map((s, i) => (
          <div key={s.key} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${i < step ? 'bg-success/15 text-success' : i === step ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}>
            {i < step && <CheckCircle2 size={13} />}
            {i + 1}. {s.label}
          </div>
        ))}
      </div>
      <stage.Comp key={stage.key} {...stage.props} onComplete={handleStageComplete} />
    </div>
  )
}
