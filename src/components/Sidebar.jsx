import { NavLink, Link } from 'react-router-dom'
import {
  GraduationCap, Award, BookOpen, Calendar, Mail, User, Settings,
  FlaskConical, Map, Plane, Boxes, Box, Leaf, Mountain, Headphones,
} from 'lucide-react'
import { categories } from '../data/courses'
import Logo from './Logo'

const mainNav = [
  { to: '/', label: 'Meus Cursos', icon: GraduationCap, end: true },
  { to: '/certificados', label: 'Certificados', icon: Award },
  { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/mensagens', label: 'Mensagens', icon: Mail, badge: 2 },
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const catIcons = {
  topografia: Map,
  drones: Plane,
  geoprocessamento: Boxes,
  modelagem: Box,
  'meio-ambiente': Leaf,
  geotecnia: Mountain,
}

function itemClass({ isActive }) {
  return [
    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-soft text-brand'
      : 'text-muted hover:text-text hover:bg-surface-2',
  ].join(' ')
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface px-4 py-6 overflow-y-auto">
      <Link to="/" className="block px-2 pt-1 pb-1">
        <Logo className="max-w-[180px]" />
      </Link>

      <nav className="flex flex-col gap-1">
        {mainNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-brand" />
                )}
                <item.icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* GeoSense Labs — destaque */}
        <NavLink to="/labs" className="mt-2">
          {({ isActive }) => (
            <div
              className={[
                'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-gradient-to-r from-brand to-brand-strong text-white shadow-lg shadow-brand/25'
                  : 'border border-brand/40 text-brand hover:bg-brand-soft',
              ].join(' ')}
            >
              <FlaskConical size={19} strokeWidth={2} />
              <span>GeoSense Labs</span>
              <span
                className={[
                  'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide',
                  isActive ? 'bg-white/20 text-white' : 'bg-brand/15 text-brand',
                ].join(' ')}
              >
                NOVO
              </span>
            </div>
          )}
        </NavLink>
      </nav>

      <div>
        <p className="px-3.5 pb-2 text-[11px] font-semibold tracking-[0.15em] text-muted">
          CATEGORIAS
        </p>
        <nav className="flex flex-col gap-0.5">
          {categories.map((c) => {
            const Icon = catIcons[c.id] || Map
            return (
              <a
                key={c.id}
                href="#"
                className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                <Icon size={17} strokeWidth={2} />
                <span>{c.label}</span>
              </a>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-semibold text-text">Precisa de ajuda?</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Nossa equipe está pronta para te apoiar.
        </p>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/50 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft transition-colors">
          <Headphones size={16} />
          Fale Conosco
        </button>
      </div>
    </aside>
  )
}
