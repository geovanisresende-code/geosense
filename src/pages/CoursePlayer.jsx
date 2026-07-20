import { useParams, Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  ArrowLeft, Play, Circle, ChevronDown, Clock, BookOpen, VideoOff, GraduationCap,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useData, categoryLabel } from '../context/DataContext'

function embedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` }
  const vim = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vim) return { type: 'iframe', src: `https://player.vimeo.com/video/${vim[1]}` }
  if (/\.(mp4|webm|ogg)$/i.test(url)) return { type: 'video', src: url }
  return { type: 'iframe', src: url }
}

export default function CoursePlayer() {
  const { id } = useParams()
  const { data } = useData()
  const course = data.courses.find((c) => c.id === id)

  const flat = useMemo(() => {
    if (!course) return []
    return course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id })))
  }, [course])

  const [currentId, setCurrentId] = useState(flat[0]?.id || null)
  const [openModule, setOpenModule] = useState(0)

  if (!course) {
    return (
      <div className="mx-auto max-w-[900px]">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="mt-6">
          <EmptyState icon={GraduationCap} title="Curso não encontrado" description="Este curso não existe ou foi removido." />
        </div>
      </div>
    )
  }

  const current = flat.find((l) => l.id === currentId) || flat[0]
  const media = current ? embedUrl(current.videoUrl) : null
  const totalLessons = flat.length

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft size={18} /> Voltar para os cursos
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-extrabold text-text sm:text-3xl">{course.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {categoryLabel(data.categories, course.category)}
          {current ? ` • ${current.moduleTitle}` : ''}
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* player */}
        <div>
          <div className="card overflow-hidden p-0">
            <div className="relative aspect-video bg-gradient-to-br from-[#22364a] to-[#0c1c2c]">
              {media ? (
                media.type === 'iframe' ? (
                  <iframe src={media.src} title={current.title} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <video src={media.src} controls className="absolute inset-0 h-full w-full" />
                )
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center text-white/80">
                  <div>
                    <VideoOff size={38} className="mx-auto opacity-70" />
                    <p className="mt-3 text-sm font-medium">
                      {totalLessons === 0 ? 'Este curso ainda não tem aulas.' : 'O vídeo desta aula ainda não foi adicionado.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {current && (
            <div className="mt-5">
              <h2 className="text-xl font-bold text-text">{current.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                {current.duration && <span className="flex items-center gap-1.5"><Clock size={16} /> {current.duration}</span>}
                <Link to="/biblioteca" className="flex items-center gap-1.5 hover:text-text"><BookOpen size={16} /> Material de apoio</Link>
              </div>
            </div>
          )}
        </div>

        {/* conteúdo do curso */}
        <aside className="card h-fit p-5">
          <h3 className="text-lg font-bold text-text">Conteúdo do curso</h3>
          <p className="mt-1 text-sm text-muted">
            {course.modules.length} módulos · {totalLessons} aulas
          </p>

          {course.modules.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">
              Nenhum módulo cadastrado ainda.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-1.5">
              {course.modules.map((m, i) => {
                const open = openModule === i
                return (
                  <div key={m.id} className="overflow-hidden rounded-xl border border-border">
                    <button onClick={() => setOpenModule(open ? -1 : i)} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold text-text">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">{i + 1}</span>
                      <span className="flex-1">{m.title}</span>
                      <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="flex flex-col gap-0.5 px-2 pb-2">
                        {m.lessons.length === 0 && <p className="px-2.5 py-2 text-xs text-muted">Sem aulas neste módulo.</p>}
                        {m.lessons.map((l) => {
                          const active = l.id === currentId
                          return (
                            <button
                              key={l.id}
                              onClick={() => setCurrentId(l.id)}
                              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ${active ? 'border border-brand/40 bg-brand-soft' : 'hover:bg-surface-2'}`}
                            >
                              {active ? <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-white"><Play size={9} /></span>
                                : <Circle size={16} className="shrink-0 text-muted/40" />}
                              <span className={`flex-1 ${active ? 'font-semibold text-brand' : 'text-text'}`}>{l.title}</span>
                              {l.duration && <span className="text-xs text-muted">{l.duration}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
