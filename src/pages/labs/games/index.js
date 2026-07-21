import FlightCoverageGame from './FlightCoverageGame'
import SatelliteLockGame from './SatelliteLockGame'
import PointCloudSortGame from './PointCloudSortGame'
import OrthomosaicPuzzle from './OrthomosaicPuzzle'
import VolumeScanGame from './VolumeScanGame'
import DroneFlightSimGame from './DroneFlightSimGame'

export const GAME_COMPONENTS = {
  'planejamento-voo': FlightCoverageGame,
  'falhas-gnss': SatelliteLockGame,
  'gerar-mdt': PointCloudSortGame,
  'ortomosaico': OrthomosaicPuzzle,
  'volume-pilha': VolumeScanGame,
  'caso-real': DroneFlightSimGame,
}
