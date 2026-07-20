import { useState } from 'react'
import { Plus, Trash2, GraduationCap, BookOpen, ChevronRight, Layers, Film } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { ACCENT_OPTIONS, ACCENT_ICONS, MODALITIES } from '../../data/icons'
import { Field, TextArea, Select, SectionTitle } from './ui'

export default function AdminCourses() {
  const { data, addCourse, updateCourse, removeCourse, addModule, updateModule, removeModule, addLesson, updateLesson, removeLesson } = useData()
  const [selectedId, setSelectedId] = useState(data.courses[0]?.id || null)
  const course = data.courses.find((c) => c.id === selectedId)

  const categoryOptions = data.categories.map((c) => ({ value: c.id, label: c.label }))

  function handleAdd() {
    const id = addCourse()
    setSelectedId(id)
  }

  return (
    <div>
      <SectionTitle
        title="Cursos"
        description="Cadastre cada curso e, dentro dele, os módulos e as aulas. (Info a pegar com o cliente: quais cursos e quantos módulos cada um.)"
        action={
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
            <Plus size={16} /> Novo curso
          </button>
        }
      />

      {data.courses.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><GraduationCap size={26} /></span>
          <p className="text-sm text-muted">Nenhum curso ainda. Clique em <strong className="text-text">Novo curso</strong> para começar.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* lista */}
          <div className="flex flex-col gap-2">
            {data.courses.map((c) => {
              const Icon = ACCENT_ICONS[c.accent] || GraduationCap
              const active = c.id === selectedId
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${active ? 'border-brand bg-brand-soft' : 'border-border bg-surface hover:bg-surface-2'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-brand text-white' : 'bg-surface-2 text-brand'}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text">{c.title || 'Sem título'}</span>
                    <span className="block text-xs text-muted">{c.modules.length} módulos</span>
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              )
            })}
          </div>

          {/* editor */}
          {course && (
            <div className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Título do curso" value={course.title} onChange={(v) => updateCourse(course.id, { title: v })} placeholder="Ex.: Topografia com Drones na Prática" /></div>
                <Select label="Categoria" value={course.category} onChange={(v) => updateCourse(course.id, { category: v })} options={categoryOptions} placeholder="Selecione…" />
                <Select label="Modalidade" value={course.modality} onChange={(v) => updateCourse(course.id, { modality: v })} options={MODALITIES} />
                <Field label="Carga horária" value={course.hours} onChange={(v) => updateCourse(course.id, { hours: v })} placeholder="Ex.: 18h de conteúdo" />
                <Select label="Ícone da capa" value={course.accent} onChange={(v) => updateCourse(course.id, { accent: v })} options={ACCENT_OPTIONS} />
                <div className="sm:col-span-2"><TextArea label="Descrição" value={course.description} onChange={(v) => updateCourse(course.id, { description: v })} placeholder="Resumo do que o aluno vai aprender." /></div>
              </div>

              {/* módulos */}
              <div className="mt-6 border-t border-border pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted"><Layers size={16} /> Módulos ({course.modules.length})</h3>
                  <button onClick={() => addModule(course.id)} className="flex items-center gap-1.5 rounded-lg border border-brand/50 px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"><Plus size={15} /> Módulo</button>
                </div>

                <div className="flex flex-col gap-3">
                  {course.modules.map((m, mi) => (
                    <div key={m.id} className="rounded-xl border border-border bg-surface-2 p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-xs font-bold text-brand">{mi + 1}</span>
                        <input value={m.title} onChange={(e) => updateModule(course.id, m.id, e.target.value)} className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text outline-none focus:border-brand" placeholder="Nome do módulo" />
                        <button onClick={() => removeModule(course.id, m.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 pl-8">
                        {m.lessons.map((l) => (
                          <div key={l.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[1fr_110px_auto]">
                            <input value={l.title} onChange={(e) => updateLesson(course.id, m.id, l.id, { title: e.target.value })} className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-text outline-none focus:border-brand" placeholder="Título da aula" />
                            <input value={l.duration} onChange={(e) => updateLesson(course.id, m.id, l.id, { duration: e.target.value })} className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-text outline-none focus:border-brand" placeholder="Duração" />
                            <button onClick={() => removeLesson(course.id, m.id, l.id)} className="grid h-8 w-8 place-items-center justify-self-end rounded-md text-muted hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                            <div className="flex items-center gap-2 sm:col-span-3">
                              <Film size={14} className="shrink-0 text-muted" />
                              <input value={l.videoUrl} onChange={(e) => updateLesson(course.id, m.id, l.id, { videoUrl: e.target.value })} className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text outline-none focus:border-brand" placeholder="Link do vídeo (YouTube, Vimeo ou .mp4) — opcional" />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addLesson(course.id, m.id)} className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft"><Plus size={14} /> Adicionar aula</button>
                      </div>
                    </div>
                  ))}
                  {course.modules.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Nenhum módulo. Adicione o primeiro acima.</p>}
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-border pt-4">
                <button onClick={() => { removeCourse(course.id); setSelectedId(data.courses.find((c) => c.id !== course.id)?.id || null) }} className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10">
                  <Trash2 size={16} /> Excluir curso
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
