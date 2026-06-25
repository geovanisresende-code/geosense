import logo from '../assets/geosense_logotipo.png'

export default function Logo({ className = '' }) {
  return (
    <img
      src={logo}
      alt="GeoSense · Engenharia + Geotecnologia"
      // o logotipo é escuro; no tema dark invertemos para branco para manter o contraste
      className={`h-auto w-full select-none object-contain dark:brightness-0 dark:invert ${className}`}
      draggable="false"
    />
  )
}
