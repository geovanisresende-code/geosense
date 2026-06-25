export const user = {
  name: 'Rafael Vilela',
  firstName: 'Rafael',
  avatar: 'https://i.pravatar.cc/120?img=12',
}

export const stats = {
  overall: 45,
  modulesDone: 12,
  modulesTotal: 27,
  studyTime: '48h 30m',
  certificates: 3,
  streak: 7,
}

export const categories = [
  { id: 'topografia', label: 'Topografia' },
  { id: 'drones', label: 'Drones' },
  { id: 'geoprocessamento', label: 'Geoprocessamento' },
  { id: 'modelagem', label: 'Modelagem 3D' },
  { id: 'meio-ambiente', label: 'Meio Ambiente' },
  { id: 'geotecnia', label: 'Geotecnia' },
]

export const courses = [
  {
    id: 'topografia-drones',
    tag: 'TOPOGRAFIA',
    badge: null,
    title: 'Topografia com Drones na Prática',
    description:
      'Aprenda as técnicas essenciais para levantamentos topográficos com drones.',
    progress: 75,
    modules: 6,
    hours: '18h de conteúdo',
    icon: 'drone',
  },
  {
    id: 'modelagem-3d',
    tag: 'MODELAGEM 3D',
    badge: 'Presencial',
    title: 'Topografia e Modelagem 3D com Drones',
    description:
      'Domine o fluxo completo: planejamento, aquisição, processamento e modelagem 3D.',
    progress: 40,
    modules: 6,
    hours: '20h de conteúdo',
    icon: 'cube',
  },
  {
    id: 'geoprocessamento',
    tag: 'GEOPROCESSAMENTO',
    badge: null,
    title: 'Geoprocessamento Aplicado',
    description: 'Processamento e análise de dados geoespaciais na prática.',
    progress: 20,
    modules: 5,
    hours: '15h de conteúdo',
    icon: 'chart',
  },
]

export const courseContent = {
  'topografia-drones': {
    title: 'Topografia com Drones na Prática',
    currentModule: 'Módulo 2 • Planejamento de Voo',
    lessonTitle: 'Planejamento de Voo: conceitos e parâmetros essenciais',
    lessonDescription:
      'Nessa aula você vai entender os principais parâmetros para um planejamento de voo eficiente e seguro, garantindo a qualidade dos dados coletados.',
    duration: '28 min',
    current: '12:45',
    total: '28:30',
    progress: 44,
    lessonsDone: 12,
    lessonsTotal: 27,
    next: { title: 'Execução de Voo com Drones', time: '30:15' },
    modules: [
      {
        title: 'Módulo 1 – Introdução',
        done: true,
        lessons: [],
      },
      {
        title: 'Módulo 2 – Planejamento de Voo',
        active: true,
        lessons: [
          { n: 1, title: 'Introdução ao planejamento', time: '18:20', done: true },
          { n: 2, title: 'Parâmetros de voo', time: '28:30', playing: true },
          { n: 3, title: 'GSD e sobreposição', time: '22:10' },
          { n: 4, title: 'Checklist pré-voo', time: '15:45' },
        ],
      },
      { title: 'Módulo 3 – Execução de Voo', lessons: [] },
      { title: 'Módulo 4 – Processamento', lessons: [] },
      { title: 'Módulo 5 – Entrega dos Dados', lessons: [] },
    ],
  },
}
