import {
  Plane, Box, PieChart, Map, Boxes, Leaf, Mountain, Satellite, Layers,
  FileText, Video, Link2, BookOpen, GraduationCap,
} from 'lucide-react'

// Ícones de destaque (capa) dos cursos
export const ACCENT_ICONS = {
  drone: Plane,
  cube: Box,
  chart: PieChart,
  map: Map,
  layers: Layers,
  leaf: Leaf,
  mountain: Mountain,
  satellite: Satellite,
  book: BookOpen,
  cap: GraduationCap,
}

export const ACCENT_OPTIONS = [
  { value: 'drone', label: 'Drone' },
  { value: 'cube', label: 'Cubo 3D' },
  { value: 'chart', label: 'Gráfico' },
  { value: 'map', label: 'Mapa' },
  { value: 'layers', label: 'Camadas' },
  { value: 'satellite', label: 'GNSS / Satélite' },
  { value: 'mountain', label: 'Relevo' },
  { value: 'leaf', label: 'Meio ambiente' },
  { value: 'book', label: 'Livro' },
  { value: 'cap', label: 'Formação' },
]

export const MODALITIES = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
]

// Tipos de item da biblioteca
export const LIBRARY_TYPES = [
  { value: 'ebook', label: 'E-book', icon: BookOpen },
  { value: 'pdf', label: 'PDF / Apostila', icon: FileText },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'artigo', label: 'Artigo', icon: FileText },
  { value: 'link', label: 'Link externo', icon: Link2 },
]

export const libraryTypeMeta = (value) =>
  LIBRARY_TYPES.find((t) => t.value === value) || LIBRARY_TYPES[LIBRARY_TYPES.length - 1]
