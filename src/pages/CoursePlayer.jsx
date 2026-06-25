import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft, CheckCircle2, MoreHorizontal, Play, Pause, RotateCcw, RotateCw,
  Volume2, Settings, Captions, PictureInPicture, Maximize, CheckCircle, Circle,
  Lock, ChevronDown, Clock, BookOpen, Download, FileDown, ChevronRight,
} from 'lucide-react'
import ProgressFooter from '../components/ProgressFooter'
import { courseContent } from '../data/courses'

export default function CoursePlayer() {
  const { id } = useParams()
  const data = courseContent[id] || courseContent['topografia-drones']
  const [playing, setPlaying] = useState(false)
  const [openModule, setOpenModule] = useState(1)

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft size={18} /> Voltar para o curso
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">{data.title}</h1>
          <p className="mt-1 text-sm text-muted">{data.currentModule}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2">
            <CheckCircle2 size={17} className="text-brand" /> Marcar como concluída
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted hover:bg-surface-2">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* player + descrição */}
        <div>
          <div className="card overflow-hidden p-0">
            <div className="relative aspect-video bg-gradient-to-br from-[#22364a] to-[#0c1c2c]">
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-black/30 backdrop-blur">
                  <button onClick={() => setPlaying((p) => !p)} className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-xl">
                    {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>
                </div>
              </div>
              <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-xs font-semibold text-white">1.00</span>
              <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md bg-black/40 text-white">
                <PictureInPicture size={16} />
              </button>

              {/* controles */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                <div className="mb-2 h-1.5 w-full rounded-full bg-white/25">
                  <div className="relative h-full rounded-full bg-brand" style={{ width: `${data.progress}%` }}>
                    <span className="absolute -right-1.5 -top-1 h-3.5 w-3.5 rounded-full bg-brand ring-2 ring-white" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white">
                  <button onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={20} /> : <Play size={20} />}</button>
                  <RotateCcw size={18} /> <RotateCw size={18} /> <Volume2 size={18} />
                  <span className="text-xs font-medium">{data.current} / {data.total}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-medium">1.25x <ChevronDown size={13} /></span>
                    <Captions size={18} /> <Settings size={18} /> <PictureInPicture size={18} /> <Maximize size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-text">{data.lessonTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{data.lessonDescription}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Clock size={16} /> {data.duration}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> Material de apoio</span>
              <span className="flex items-center gap-1.5"><Download size={16} /> Baixar aula</span>
              <div className="ml-auto flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
                <div className="text-right">
                  <p className="text-[11px] text-muted">Próxima aula</p>
                  <p className="text-sm font-semibold text-text">{data.next.title}</p>
                  <p className="text-[11px] text-muted">{data.next.time}</p>
                </div>
                <span className="h-11 w-16 rounded-lg bg-gradient-to-br from-[#2a4258] to-[#10263a]" />
                <ChevronRight size={18} className="text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* conteúdo do curso */}
        <aside className="card h-fit p-5">
          <h3 className="text-lg font-bold text-text">Conteúdo do curso</h3>
          <p className="mt-1 text-sm">
            <span className="font-bold text-brand">{data.lessonsDone}</span>
            <span className="text-muted"> / {data.lessonsTotal} aulas concluídas</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(data.lessonsDone / data.lessonsTotal) * 100}%` }} />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            {data.modules.map((m, i) => {
              const open = openModule === i
              return (
                <div key={i} className={`rounded-xl border ${m.active ? 'border-brand/40' : 'border-border'} overflow-hidden`}>
                  <button
                    onClick={() => setOpenModule(open ? -1 : i)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold ${m.active ? 'text-text' : 'text-muted'}`}
                  >
                    {m.done ? <CheckCircle size={18} className="text-success" /> : m.active ? (
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-brand text-white"><Play size={10} /></span>
                    ) : <Circle size={18} className="text-muted/50" />}
                    <span className="flex-1">{m.title}</span>
                    <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && m.lessons.length > 0 && (
                    <div className="flex flex-col gap-0.5 px-2 pb-2">
                      {m.lessons.map((l) => (
                        <div
                          key={l.n}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${l.playing ? 'border border-brand/40 bg-brand-soft' : 'hover:bg-surface-2'}`}
                        >
                          {l.done ? <CheckCircle size={16} className="text-success shrink-0" /> :
                            l.playing ? <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-white"><Play size={9} /></span> :
                            <Circle size={16} className="shrink-0 text-muted/40" />}
                          <span className={`flex-1 ${l.playing ? 'font-semibold text-brand' : 'text-text'}`}>{l.n}. {l.title}</span>
                          <span className="text-xs text-muted">{l.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/50 px-4 py-3 text-sm font-semibold text-brand hover:bg-brand-soft">
            <FileDown size={17} /> Baixar materiais do curso
          </button>
        </aside>
      </div>

      <ProgressFooter />
    </div>
  )
}
