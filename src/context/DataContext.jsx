import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext()

const EMPTY = { settings: { platformName: 'GeoSense', tagline: 'Engenharia · Geotecnologia' }, categories: [], courses: [], events: [], library: [], announcements: [] }

// ── mapeamento DB → frontend ────────────────────────────────────────────────
const mapLesson = (l) => ({ id: l.id, title: l.title, duration: l.duration || '', videoUrl: l.video_url || '' })
const mapEvent = (e) => ({ id: e.id, title: e.title, date: e.date || '', time: e.time || '', modality: e.modality, location: e.location || '', description: e.description || '' })
const mapLib = (i) => ({ id: i.id, title: i.title, type: i.type, category: i.category_id || '', url: i.url || '', description: i.description || '' })

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(EMPTY)
  const [progress, setProgress] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const timers = useRef({})

  const patchLocal = (fn) => setData((d) => fn(structuredClone(d)))

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    setLoading(true)
    const [set, cats, courses, mods, less, events, lib, ann] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*').order('position'),
      supabase.from('courses').select('*').order('position').order('created_at'),
      supabase.from('modules').select('*').order('position'),
      supabase.from('lessons').select('*').order('position'),
      supabase.from('events').select('*').order('date'),
      supabase.from('library_items').select('*').order('created_at'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    ])

    const lessonsByModule = {}
    ;(less.data || []).forEach((l) => { (lessonsByModule[l.module_id] ||= []).push(mapLesson(l)) })
    const modulesByCourse = {}
    ;(mods.data || []).forEach((m) => { (modulesByCourse[m.course_id] ||= []).push({ id: m.id, title: m.title, lessons: lessonsByModule[m.id] || [] }) })

    setData({
      settings: { platformName: set.data?.platform_name || 'GeoSense', tagline: set.data?.tagline || '' },
      categories: (cats.data || []).map((c) => ({ id: c.id, label: c.label })),
      courses: (courses.data || []).map((c) => ({ id: c.id, title: c.title, category: c.category_id || '', modality: c.modality, hours: c.hours || '', description: c.description || '', accent: c.accent || 'cap', modules: modulesByCourse[c.id] || [] })),
      events: (events.data || []).map(mapEvent),
      library: (lib.data || []).map(mapLib),
      announcements: (ann.data || []).map((a) => ({ id: a.id, title: a.title, body: a.body || '', created_at: a.created_at })),
    })
    setLoading(false)
  }, [])

  const refreshProgress = useCallback(async () => {
    if (!isSupabaseConfigured || !user) { setProgress(new Set()); return }
    const { data: rows } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id)
    setProgress(new Set((rows || []).map((r) => r.lesson_id)))
  }, [user])

  useEffect(() => {
    if (user) { fetchAll(); refreshProgress() }
    else { setData(EMPTY); setProgress(new Set()); setLoading(false) }
  }, [user, fetchAll, refreshProgress])

  // update de texto: otimista no local + escrita "debounced" no banco
  const debouncedUpdate = (table, id, dbPatch, idCol = 'id') => {
    const key = `${table}:${id}`
    const prev = timers.current[key]
    if (prev) clearTimeout(prev.t)
    const patch = { ...(prev?.patch || {}), ...dbPatch }
    timers.current[key] = { patch, t: setTimeout(async () => { await supabase.from(table).update(patch).eq(idCol, id); delete timers.current[key] }, 500) }
  }

  // ── Settings ──
  const updateSettings = (s) => {
    patchLocal((d) => ({ ...d, settings: { ...d.settings, ...s } }))
    const db = {}; if ('platformName' in s) db.platform_name = s.platformName; if ('tagline' in s) db.tagline = s.tagline
    debouncedUpdate('settings', 1, db)
  }

  // ── Categorias ──
  const addCategory = async (label) => {
    const position = data.categories.length + 1
    const { data: row } = await supabase.from('categories').insert({ label: (label || 'Nova categoria').trim(), position }).select().single()
    if (row) patchLocal((d) => { d.categories.push({ id: row.id, label: row.label }); return d })
  }
  const updateCategory = (id, label) => { patchLocal((d) => { const c = d.categories.find((x) => x.id === id); if (c) c.label = label; return d }); debouncedUpdate('categories', id, { label }) }
  const removeCategory = async (id) => { await supabase.from('categories').delete().eq('id', id); patchLocal((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) })) }

  // ── Cursos ──
  const addCourse = async () => {
    const position = data.courses.length + 1
    const { data: row } = await supabase.from('courses').insert({ position }).select().single()
    if (!row) return null
    patchLocal((d) => { d.courses.push({ id: row.id, title: row.title, category: row.category_id || '', modality: row.modality, hours: row.hours || '', description: row.description || '', accent: row.accent || 'cap', modules: [] }); return d })
    return row.id
  }
  const updateCourse = (id, p) => {
    patchLocal((d) => { const c = d.courses.find((x) => x.id === id); if (c) Object.assign(c, p); return d })
    const db = {}; ;['title', 'modality', 'hours', 'description', 'accent'].forEach((k) => { if (k in p) db[k] = p[k] }); if ('category' in p) db.category_id = p.category || null
    debouncedUpdate('courses', id, db)
  }
  const removeCourse = async (id) => { await supabase.from('courses').delete().eq('id', id); patchLocal((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== id) })) }

  // ── Módulos ──
  const addModule = async (courseId) => {
    const course = data.courses.find((c) => c.id === courseId)
    const { data: row } = await supabase.from('modules').insert({ course_id: courseId, title: `Módulo ${(course?.modules.length || 0) + 1}`, position: (course?.modules.length || 0) + 1 }).select().single()
    if (row) patchLocal((d) => { d.courses.find((c) => c.id === courseId)?.modules.push({ id: row.id, title: row.title, lessons: [] }); return d })
  }
  const updateModule = (courseId, moduleId, title) => { patchLocal((d) => { const m = d.courses.find((c) => c.id === courseId)?.modules.find((x) => x.id === moduleId); if (m) m.title = title; return d }); debouncedUpdate('modules', moduleId, { title }) }
  const removeModule = async (courseId, moduleId) => { await supabase.from('modules').delete().eq('id', moduleId); patchLocal((d) => { const c = d.courses.find((x) => x.id === courseId); if (c) c.modules = c.modules.filter((m) => m.id !== moduleId); return d }) }

  // ── Aulas ──
  const addLesson = async (courseId, moduleId) => {
    const mod = data.courses.find((c) => c.id === courseId)?.modules.find((m) => m.id === moduleId)
    const { data: row } = await supabase.from('lessons').insert({ module_id: moduleId, position: (mod?.lessons.length || 0) + 1 }).select().single()
    if (row) patchLocal((d) => { d.courses.find((c) => c.id === courseId)?.modules.find((m) => m.id === moduleId)?.lessons.push(mapLesson(row)); return d })
  }
  const updateLesson = (courseId, moduleId, lessonId, p) => {
    patchLocal((d) => { const l = d.courses.find((c) => c.id === courseId)?.modules.find((m) => m.id === moduleId)?.lessons.find((x) => x.id === lessonId); if (l) Object.assign(l, p); return d })
    const db = {}; if ('title' in p) db.title = p.title; if ('duration' in p) db.duration = p.duration; if ('videoUrl' in p) db.video_url = p.videoUrl
    debouncedUpdate('lessons', lessonId, db)
  }
  const removeLesson = async (courseId, moduleId, lessonId) => { await supabase.from('lessons').delete().eq('id', lessonId); patchLocal((d) => { const m = d.courses.find((c) => c.id === courseId)?.modules.find((x) => x.id === moduleId); if (m) m.lessons = m.lessons.filter((l) => l.id !== lessonId); return d }) }

  // ── Calendário ──
  const addEvent = async () => { const { data: row } = await supabase.from('events').insert({ title: 'Novo evento' }).select().single(); if (row) patchLocal((d) => { d.events.push(mapEvent(row)); return d }) }
  const updateEvent = (id, p) => { patchLocal((d) => { const e = d.events.find((x) => x.id === id); if (e) Object.assign(e, p); return d }); const db = {}; ;['title', 'date', 'time', 'modality', 'location', 'description'].forEach((k) => { if (k in p) db[k] = p[k] || (k === 'date' ? null : '') }); debouncedUpdate('events', id, db) }
  const removeEvent = async (id) => { await supabase.from('events').delete().eq('id', id); patchLocal((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) })) }

  // ── Biblioteca ──
  const addLibraryItem = async () => { const { data: row } = await supabase.from('library_items').insert({ title: 'Novo material' }).select().single(); if (row) patchLocal((d) => { d.library.push(mapLib(row)); return d }) }
  const updateLibraryItem = (id, p) => { patchLocal((d) => { const i = d.library.find((x) => x.id === id); if (i) Object.assign(i, p); return d }); const db = {}; ;['title', 'type', 'url', 'description'].forEach((k) => { if (k in p) db[k] = p[k] }); if ('category' in p) db.category_id = p.category || null; debouncedUpdate('library_items', id, db) }
  const removeLibraryItem = async (id) => { await supabase.from('library_items').delete().eq('id', id); patchLocal((d) => ({ ...d, library: d.library.filter((i) => i.id !== id) })) }

  // ── Avisos ──
  const addAnnouncement = async ({ title, body }) => { const { data: row } = await supabase.from('announcements').insert({ title: title || 'Novo aviso', body: body || '' }).select().single(); if (row) patchLocal((d) => { d.announcements.unshift({ id: row.id, title: row.title, body: row.body || '', created_at: row.created_at }); return d }) }
  const updateAnnouncement = (id, p) => { patchLocal((d) => { const a = d.announcements.find((x) => x.id === id); if (a) Object.assign(a, p); return d }); debouncedUpdate('announcements', id, p) }
  const removeAnnouncement = async (id) => { await supabase.from('announcements').delete().eq('id', id); patchLocal((d) => ({ ...d, announcements: d.announcements.filter((a) => a.id !== id) })) }

  // ── Progresso / Certificados ──
  const setLessonComplete = async (lessonId, done) => {
    if (!user) return
    if (done) { await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: lessonId }); setProgress((s) => new Set(s).add(lessonId)) }
    else { await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', lessonId); setProgress((s) => { const n = new Set(s); n.delete(lessonId); return n }) }
  }

  // ── Backup / limpeza ──
  const exportData = () => data
  const clearAllContent = async () => {
    await Promise.all([
      supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('library_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])
    await fetchAll()
  }

  return (
    <DataContext.Provider value={{
      data, loading, progress,
      updateSettings, addCategory, updateCategory, removeCategory,
      addCourse, updateCourse, removeCourse,
      addModule, updateModule, removeModule,
      addLesson, updateLesson, removeLesson,
      addEvent, updateEvent, removeEvent,
      addLibraryItem, updateLibraryItem, removeLibraryItem,
      addAnnouncement, updateAnnouncement, removeAnnouncement,
      setLessonComplete, exportData, clearAllContent, refetch: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

export function categoryLabel(categories, value) {
  if (!value) return ''
  const c = categories.find((x) => x.id === value || x.label === value)
  return c ? c.label : ''
}
