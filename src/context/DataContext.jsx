import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DataContext = createContext()
const STORAGE_KEY = 'geosense:data:v1'

const uid = () => Math.random().toString(36).slice(2, 10)

// Estado inicial — SEM dados fictícios de conteúdo.
// As categorias já vêm com as áreas de atuação da GeoSense (editáveis no painel).
export const DEFAULT_DATA = {
  settings: {
    platformName: 'GeoSense',
    tagline: 'Engenharia · Geotecnologia',
  },
  categories: [
    { id: 'topografia', label: 'Topografia' },
    { id: 'drones', label: 'Drones' },
    { id: 'geoprocessamento', label: 'Geoprocessamento' },
    { id: 'modelagem', label: 'Modelagem 3D' },
    { id: 'meio-ambiente', label: 'Meio Ambiente' },
    { id: 'geotecnia', label: 'Geotecnia' },
  ],
  courses: [], // { id, title, category, modality, hours, description, accent, modules: [{id,title,lessons:[{id,title,duration,videoUrl}]}] }
  events: [], // { id, title, date, time, modality, location, description }
  library: [], // { id, title, type, category, url, description }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_DATA)
    const parsed = JSON.parse(raw)
    // merge defensivo para versões futuras
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
    }
  } catch {
    return structuredClone(DEFAULT_DATA)
  }
}

export function DataProvider({ children }) {
  const [data, setData] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const api = useMemo(() => {
    const patch = (fn) => setData((d) => fn(structuredClone(d)))

    return {
      // ── Configurações ────────────────────────────────
      updateSettings: (s) => patch((d) => ({ ...d, settings: { ...d.settings, ...s } })),

      // ── Categorias ───────────────────────────────────
      addCategory: (label) =>
        patch((d) => {
          d.categories.push({ id: uid(), label: label.trim() || 'Nova categoria' })
          return d
        }),
      updateCategory: (id, label) =>
        patch((d) => {
          const c = d.categories.find((x) => x.id === id)
          if (c) c.label = label
          return d
        }),
      removeCategory: (id) => patch((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) })),

      // ── Cursos ───────────────────────────────────────
      addCourse: () => {
        const id = uid()
        patch((d) => {
          d.courses.push({
            id,
            title: 'Novo curso',
            category: '',
            modality: 'online',
            hours: '',
            description: '',
            accent: 'cap',
            modules: [],
          })
          return d
        })
        return id
      },
      updateCourse: (id, p) =>
        patch((d) => {
          const c = d.courses.find((x) => x.id === id)
          if (c) Object.assign(c, p)
          return d
        }),
      removeCourse: (id) => patch((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== id) })),

      // ── Módulos ──────────────────────────────────────
      addModule: (courseId, title) =>
        patch((d) => {
          const c = d.courses.find((x) => x.id === courseId)
          if (c) c.modules.push({ id: uid(), title: title?.trim() || `Módulo ${c.modules.length + 1}`, lessons: [] })
          return d
        }),
      updateModule: (courseId, moduleId, title) =>
        patch((d) => {
          const m = d.courses.find((x) => x.id === courseId)?.modules.find((x) => x.id === moduleId)
          if (m) m.title = title
          return d
        }),
      removeModule: (courseId, moduleId) =>
        patch((d) => {
          const c = d.courses.find((x) => x.id === courseId)
          if (c) c.modules = c.modules.filter((m) => m.id !== moduleId)
          return d
        }),

      // ── Aulas ────────────────────────────────────────
      addLesson: (courseId, moduleId, lesson) =>
        patch((d) => {
          const m = d.courses.find((x) => x.id === courseId)?.modules.find((x) => x.id === moduleId)
          if (m) m.lessons.push({ id: uid(), title: 'Nova aula', duration: '', videoUrl: '', ...lesson })
          return d
        }),
      updateLesson: (courseId, moduleId, lessonId, p) =>
        patch((d) => {
          const l = d.courses.find((x) => x.id === courseId)?.modules.find((x) => x.id === moduleId)?.lessons.find((x) => x.id === lessonId)
          if (l) Object.assign(l, p)
          return d
        }),
      removeLesson: (courseId, moduleId, lessonId) =>
        patch((d) => {
          const m = d.courses.find((x) => x.id === courseId)?.modules.find((x) => x.id === moduleId)
          if (m) m.lessons = m.lessons.filter((l) => l.id !== lessonId)
          return d
        }),

      // ── Calendário ───────────────────────────────────
      addEvent: (ev) => patch((d) => { d.events.push({ id: uid(), title: '', date: '', time: '', modality: 'online', location: '', description: '', ...ev }); return d }),
      updateEvent: (id, p) => patch((d) => { const e = d.events.find((x) => x.id === id); if (e) Object.assign(e, p); return d }),
      removeEvent: (id) => patch((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) })),

      // ── Biblioteca ───────────────────────────────────
      addLibraryItem: (it) => patch((d) => { d.library.push({ id: uid(), title: '', type: 'pdf', category: '', url: '', description: '', ...it }); return d }),
      updateLibraryItem: (id, p) => patch((d) => { const i = d.library.find((x) => x.id === id); if (i) Object.assign(i, p); return d }),
      removeLibraryItem: (id) => patch((d) => ({ ...d, library: d.library.filter((i) => i.id !== id) })),

      // ── Dados (backup / handover) ────────────────────
      importData: (obj) => setData({ ...structuredClone(DEFAULT_DATA), ...obj, settings: { ...DEFAULT_DATA.settings, ...(obj.settings || {}) } }),
      resetData: () => setData(structuredClone(DEFAULT_DATA)),
    }
  }, [])

  return <DataContext.Provider value={{ data, ...api }}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)

// helper: nome da categoria a partir do id (ou o próprio valor se já for texto)
export function categoryLabel(categories, value) {
  if (!value) return ''
  const c = categories.find((x) => x.id === value || x.label === value)
  return c ? c.label : value
}
